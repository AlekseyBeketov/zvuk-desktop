use serde_json::Value;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Url, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::oneshot;

const SITE: &str = "https://zvuk.com";

/// Мост: все запросы к API Zvuk выполняются ВНУТРИ webview, загружающего zvuk.com
/// (same-origin fetch: cookies + WAF-челлендж + настоящий WebKit-отпечаток).
/// Rust только доставляет JS в worker-webview (eval_with_callback) и возвращает
/// результат фронту. Это единственный надёжный путь мимо WAF Servicepipe,
/// который привязан к TLS-отпечатку клиента (curl/reqwest получают 307-челлендж).

type PendingTx = oneshot::Sender<Result<Value, String>>;

struct Bridge {
    pending: Mutex<HashMap<String, PendingTx>>,
    counter: AtomicU64,
}

static BRIDGE: OnceLock<Bridge> = OnceLock::new();

fn bridge() -> &'static Bridge {
    BRIDGE.get_or_init(|| Bridge {
        pending: Mutex::new(HashMap::new()),
        counter: AtomicU64::new(1),
    })
}

/// Выполнить HTTP-запрос через worker-webview (same-origin zvuk.com).
/// Возвращает JSON-ответ или Err("HTTP <status>: <snippet>").
pub async fn request(
    app: &AppHandle,
    method: &str,
    url: &str,
    body: Option<&Value>,
    extra_headers: &[(&str, &str)],
) -> Result<Value, String> {
    let webview = app
        .get_webview_window("net")
        .ok_or_else(|| "NET_WORKER_NOT_RUNNING".to_string())?;

    let id = format!(
        "req{}{}",
        bridge().counter.fetch_add(1, Ordering::SeqCst),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.subsec_nanos())
            .unwrap_or(0)
    );

    let (tx, rx) = oneshot::channel();
    bridge()
        .pending
        .lock()
        .map_err(|_| "bridge poisoned")?
        .insert(id.clone(), tx);

    let method_js = serde_json::to_string(method).unwrap_or_default();
    let url_js = serde_json::to_string(url).unwrap_or_default();
    let body_js = match body {
        Some(b) => serde_json::to_string(b).unwrap_or_default(),
        None => "null".into(),
    };
    let headers_js = serde_json::to_string(extra_headers).unwrap_or_default();

    // Самодостаточный скрипт: same-origin fetch, результат — {status, text}.
    let js = format!(
        r#"(async () => {{
            try {{
                const r = await fetch({url_js}, {{
                    method: {method_js},
                    credentials: 'include',
                    headers: Object.assign({{}},
                        {{'Content-Type': 'application/json', 'x-app-name': 'web'}},
                        {headers_js}),
                    body: {body_js} === null ? undefined : ({body_js} ? JSON.stringify({body_js}) : undefined)
                }});
                const t = await r.text();
                return JSON.stringify({{status: r.status, text: t}});
            }} catch (e) {{
                return JSON.stringify({{status: 0, text: String(e)}});
            }}
        }})()"#
    );

    let app2 = app.clone();
    let id2 = id.clone();
    let eval_res = webview.eval_with_callback(js, move |result_json: String| {
        // result_json — JSON-сериализация возвращённой строки ({status,text})
        let outcome = (|| -> Result<Value, String> {
            let inner: String =
                serde_json::from_str(&result_json).map_err(|e| format!("eval result: {e}"))?;
            let wrap: Value = serde_json::from_str(&inner).map_err(|e| format!("wrap: {e}"))?;
            let status = wrap["status"].as_u64().unwrap_or(0);
            let text = wrap["text"].as_str().unwrap_or("").to_string();
            if status == 0 {
                return Err(format!("NETWORK: {text}"));
            }
            if !(200..300).contains(&status) {
                return Err(format!("HTTP {}: {}", status, text.chars().take(200).collect::<String>()));
            }
            serde_json::from_str(&text).or_else(|_| Ok(Value::String(text)))
        })();
        if let Some(tx) = bridge()
            .pending
            .lock()
            .ok()
            .and_then(|mut p| p.remove(&id2))
        {
            let _ = tx.send(outcome);
        }
    });

    if let Err(e) = eval_res {
        bridge().pending.lock().ok().and_then(|mut p| p.remove(&id));
        return Err(format!("EVAL: {e}"));
    }

    // Небольшой таймаут на случай зависшей страницы.
    match tokio::time::timeout(Duration::from_secs(30), rx).await {
        Ok(Ok(res)) => res,
        Ok(Err(_)) => Err("BRIDGE_DROPPED".into()),
        Err(_) => Err("TIMEOUT".into()),
    }
}

/// Совместимость: pending-карта живёт в static BRIDGE (см. bridge()).

/// Запустить worker-webview: скрытое окно на zvuk.com. При загрузке страниц
/// WAF-челлендж проходит нативно; cookies остаются в cookie-store webview.
pub fn start_net_worker(app: &AppHandle) {
    let _ = bridge(); // init
    let url: Url = SITE.parse().expect("valid url");
    let app2 = app.clone();

    let build = move || {
        let _ = WebviewWindowBuilder::new(&app2, "net", WebviewUrl::External(url))
            .title("Zvuk Network")
            .inner_size(420.0, 300.0)
            .visible(false)
            .build();
    };

    let _ = app.run_on_main_thread(build);
}

/// Открыть видимое окно логина (пользователь входит через Sber ID).
/// В фоне опрашиваем профиль; после успеха — Keychain + событие login-success.
pub fn open_login_window(app: AppHandle) -> Result<(), String> {
    let url: Url = SITE.parse().map_err(|e| format!("url: {e}"))?;
    let app2 = app.clone();

    app.run_on_main_thread(move || {
        let _ = WebviewWindowBuilder::new(&app2, "login", WebviewUrl::External(url))
            .title("Вход — Zvuk")
            .inner_size(1000.0, 700.0)
            .build();

        let app3 = app2.clone();
        tauri::async_runtime::spawn(async move {
            for _ in 0..300 {
                // 10 минут, опрос каждые 2с
                tokio::time::sleep(Duration::from_secs(2)).await;
                if app3.get_webview_window("login").is_none() {
                    return; // окно закрыли
                }
                match request(&app3, "GET", "https://zvuk.com/api/tiny/profile", None, &[]).await {
                    Ok(v) => {
                        let token = v["result"]["token"].as_str().map(|s| s.to_string());
                        if let Some(t) = token {
                            let _ = crate::auth::save(&crate::auth::Credentials {
                                token: Some(t),
                                refresh_token: None,
                            });
                            let _ = app3.emit("login-success", v);
                            if let Some(w) = app3.get_webview_window("login") {
                                let _ = w.close();
                            }
                            return;
                        }
                    }
                    Err(_) => continue, // WAF/челлендж/не вошёл — ждём дальше
                }
            }
        });
    })
    .map_err(|e| format!("main thread: {e}"))
}

#[tauri::command]
pub fn open_login(app: AppHandle) -> Result<(), String> {
    open_login_window(app)
}

#[tauri::command]
pub async fn api_fetch(
    app: AppHandle,
    method: String,
    url: String,
    body: Option<Value>,
) -> Result<Value, String> {
    request(&app, &method, &url, body.as_ref(), &[]).await
}
