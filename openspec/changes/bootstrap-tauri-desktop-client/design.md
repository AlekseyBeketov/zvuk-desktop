# Design: bootstrap-tauri-desktop-client

## Context

- Платформа: macOS, Rust (решение владельца). Фреймворк: Tauri 2 (нативный WKWebView).
- WAF Servicepipe закрывает zvuk.com (в т.ч. `/api/*`) JS-челленджем: curl/headless → 418.
  Внутри WKWebView челлендж выполняется нативно (PWA работает так же).
- API-контракты восстановлены из бандла веб-плеера (3.7MB, tools/artifacts/zvuk-web/):
  GraphQL `/api/v1/graphql` (115 операций), Tiny API, `X-Auth-Token`,
  refresh `/web-api/v2/token/refresh`, стрим через `getStream` (quality: sq|mid|high|hq|hifi,
  encodeType: fp|wv), stream-URL с `expire`.
- Кросс-проверка: docs/research/zvuk-ecosystem.md (58-методный Python-клиент, Swift/Go/TS,
  zvuk-dl-rs: FLAC/MP3 320/MP3 128, Murglar: MP3 128 без подписки, MP3 320/FLAC с Prime).

## Goals / Non-Goals

- Goals: весь музыкальный функционал Zvuk в нативном окне; авторизация один раз; media keys.
- Non-Goals: раздел «Атлас» (отложен по решению владельца); скачивание контента; обход DRM;
  поддержка Windows/Linux в первой итерации.

## Decisions

### D1v2. Сетевой слой — worker-webview мост (замена D1 после живой проверки)
**Факт из живой проверки:** WAF Servicepipe привязан к TLS-отпечатку клиента — даже с полными
cookies браузера curl/reqwest получают 307-челлендж. CORS при этом не проблема: сервер эхом
отдаёт `access-control-allow-origin`.
**Выбор**: все API-запросы выполняются в скрытом worker-webview, загруженном с `zvuk.com`
(same-origin fetch, cookies, настоящий WebKit-отпечаток). Rust-команда `api_fetch` доставляет
JS в worker через `eval_with_callback` (результат промиса возвращается в Rust) и отдаёт ответ
фронту. Логин — видимое окно на zvuk.com (Sber ID); после успеха Rust сохраняет токен в
Keychain и шлёт `login-success`.
**Последствия**: фронт вообще не ходит в сеть; reqwest убран из контура (dependency может
потребоваться позже для стрима — пока не подключён).

### D2. Аудио — webview `<audio>` в первой итерации
**Выбор**: воспроизведение HTML5 Audio в webview; stream-URL отдаётся командой Tauri.
**Почему**: WKWebView декодирует AAC/HLS нативно, не нужен symphonia/CPAL, меньше рисков.
**Риск**: системные media events webview → решается Now Playing интеграцией через Rust.
**Альтернатива (backup)**: rodio/symphonia в Rust, если webview-аудио даст ограничения.

### D3. Авторизация
Отдельное окно webview на auth-поток; после входа токен извлекается из
`/api/tiny/profile` (поле token) и кладётся в Keychain (crate `keyring`).
Дальше frontend подставляет `X-Auth-Token` в каждый запрос.

### D4. Frontend
TypeScript + Vite, без тяжёлого фреймворка первой итерацией (минимальность; в бандле Zvuk — React/Next,
но нам достаточно лёгкого слоя). Если UI усложнится — добавить Preact/Svelte точечно.

### D5. Tokens/ secrets
Только токен в Keychain; никакие cookie/пароли не выносятся на диск приложения.

## Risks / Trade-offs

- WAF может агрессивно проверять не-PWA клиенты → mitigation: webview-first, легитимный UA,
  диагностика ошибки без обхода (см. specs/api-client).
- Контракты API нестабильны (свидетельства из ecosystem: проекты ломались в 2025-2026) →
  mitigation: типизированный слой + снапшоты-тесты операций.
- Плейлист/expire-логика: refresh URL на подлёте к expire.

## Migration Plan

1. Каркас Tauri 2 (app-shell) → 2. auth → 3. api-client → 4. catalog/feed/collection → 5. player → 6. system-integration.

## Open Questions

- Финальная проверка потока и заголовков (Referer/Origin/UA) — на живом аккаунте в webview.
- Нужен ли menu-bar (трей) режим — уточнить у владельца после MVP.
