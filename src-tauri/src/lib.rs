mod auth;
mod media;
mod net;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            media::init_media_controls(handle.clone());
            // Worker-webview для API-запросов (same-origin zvuk.com, реальный WebKit)
            net::start_net_worker(&handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::get_credentials,
            auth::save_credentials,
            auth::clear_credentials,
            media::set_now_playing,
            net::open_login,
            net::api_fetch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
