# Proposal: bootstrap-tauri-desktop-client

## Why

Пользователь пользуется Zvuk (zvuk.com) через PWA, что неудобно по сравнению с нативным
десктоп-приложением. Официального desktop-клиента для macOS нет. Нужен нативный клиент
на Rust, покрывающий весь музыкальный функционал Zvuk (кроме, возможно, раздела «Атлас»).

## What Changes

- Создаётся каркас desktop-приложения на **Tauri 2** (Rust backend, webview frontend).
- Проводится REA-исследование веб-плеера Zvuk (бандл из 22 чанков, 3.7MB уже скачан в
  `tools/artifacts/zvuk-web/`) для восстановления API-контрактов: GraphQL `/api/v1/graphql`
  (115 операций), Tiny API (`/api/tiny/profile`, `/api/tiny/grid`, `/api/tiny/musixmatch/lyrics`),
  авторизация (`X-Auth-Token`, `/web-api/v2/token/refresh`, `id.zvuk.com`), стрим
  (`getStream`: quality=hifi/hq, encodeType=fp/wv).
- Реализуется авторизация через встроенный webview (WAF Servicepipe требует JS-челлендж —
  сетевой слой API-запросов идёт из webview-контекста, Rust отвечает за плеер и OS-интеграцию).
- Реализуется основной музыкальный функционал: поиск, лента/подборки, релизы/треки,
  плейлисты, избранное/коллекция, подкасты, плеер (queue/shuffle/repeat/seek), media keys.

## Capabilities

### New Capabilities
- `app-shell`: каркас Tauri 2 приложения, окно, навигация, сборка и запуск на macOS.
- `auth`: авторизация через webview, хранение токена в Keychain, refresh-цикл.
- `api-client`: клиент API Zvuk (GraphQL + Tiny API) из webview-контекста, обход WAF.
- `catalog`: поиск, релизы, треки, артисты, плейлисты, подкасты — экраны каталога.
- `collection`: избранное/коллекция пользователя, лайки, персональные плейлисты.
- `feed`: лента/подборки/grid-контент на главной.
- `player`: воспроизведение потоков, очередь, shuffle/repeat, seek, качество (hq/hifi).
- `system-integration`: media keys, Now Playing (MPNowPlayingInfoCenter), трей, дock-badge.

### Modified Capabilities

(нет — проект создаётся с нуля)
