# Архитектура десктопного клиента Zvuk на Rust/Tauri 2

**Статус:** написано в родительской сессии (субагент-исследователь упал по 429 лимита провайдера;
контракты — из REA-анализа бандла + crates.io). Решения управляются спекой
`openspec/changes/bootstrap-tauri-desktop-client`.

## 1. Стек
- **Tauri 2** (confirmed: tauri 2.x, crate tauri), Rust (rustc 1.99.1), frontend — TypeScript + Vite (vanilla),
  сборка .app на macOS. Крейт `keyring 4.2.0` (All-in-One, 35.9M загрузок) — Keychain.
  `souvlaki 0.9.3` (media keys + Now Playing, macOS) — подтверждён на crates.io.
- Окно 1200x800, productName «Zvuk Desktop», identifier ru.zvuk.desktop.

## 2. Сетевой слой (api-client)
- API живёт за WAF Servicepipe (JS-челлендж) → запросы идут из webview-контекста (cookies/челлендж проходят
  в WKWebView). Rust НЕ ходит в zvuk.com напрямую; Rust получает stream-URL и держит аудио и OS-интеграцию.
- GraphQL `/api/v1/graphql` (115 операций), `getStream` (quality: sq|mid|high|hq|hifi, encodeType fp|wv),
  Tiny API: `/api/tiny/profile` (токен), `/api/tiny/grid*`, `/api/tiny/musixmatch/lyrics`.
- Error-слой: 401 → refresh `/web-api/v2/token/refresh` + retry; антибот → диагностика без тиродов.

## 3. Аудио (player)
- Первая итерация: HTML5 `<audio>` в webview (WKWebView декодирует AAC нативно; HLS/AAC потоки) —
  минимум рисков; альтернатива — rodio/symphonia в Rust, если webview-аудио упрётся в gapless/фон.
- stream-URL временный (`expire`) → refresh URL на подлёте без потери позиции.
- Очередь/shuffle/repeat/seek в frontend; Rust — только команды.

## 4. Авторизация
- Auth-окно webview → после входа берём токен из `/api/tiny/profile` → Keychain (keyring).
- Хранение: `keyring` (keyring.create("zvuk-desktop", "sz.zz")); токен только в Keychain.
- 401 → refresh; исчерпание → redirect в id.zvuk.com → снова auth-окно.

## 5. Системная интеграция
- Media keys: `souvlaki` (MediaControlEvent), Now Playing через souvlaki/mpv-like events → команды плеера.
- Ошибка-паттерн: события медиаконтроллеров → Tauri command → плеер.

## 6. Упаковка
- macOS: `npm run tauri build` → .app; .dmg — `tauri build --bundles dmg`; codesign/notarize — по сертификату.
- Сборка и подпись — на этапе 8 спеки (поставка).

## 7. Открытые вопросы (проверка на живом аккаунте в webview)
- Поведение WAF в WKWebView: проходит ли челлендж без рефрешей.
- Referer/Origin/UA к scontent-хостам потоков.
