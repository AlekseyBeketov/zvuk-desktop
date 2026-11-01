# AGENTS.md — Zvuk Desktop

Неофициальный десктоп-клиент музыкального сервиса Zvuk (Сбер Звук) для macOS.

## Стек
- Rust + Tauri 2 (`src-tauri/`): команды, Keychain (keyring), media keys / Now Playing (souvlaki).
- Frontend: TypeScript + Vite (vanilla), без тяжёлых фреймворков.
- Сборка: `npm i`, `npm run tauri dev`, `npm run tauri build` (создаёт .app/.dmg).

## Структура
- `src/` — frontend: `main.ts` (роутер/плеер-бар), `store.ts` (состояние+события),
  `api/` (типы, GraphQL-документы, клиент), `components/` (player, ui), `views/` (экраны).
- `src-tauri/` — Rust: `auth.rs` (Keychain), `media.rs` (souvlaki), `lib.rs` (обработчики).
- `openspec/` — спецификации (spec-driven). `docs/research/` — находки и контракты API.
- `tools/artifacts/zvuk-web/` — бандл веб-плеера и evidence REA (не коммитим).

## Правила работы агентов
- Ответы — на русском, технические термины — на английском.
- Поиск по коду: Graphify (граф) → CodeGraph (навигация) → tgrep (паттерны).
- WAF: не делать scraping/парсинг zvuk.com с сервера; сеть фронта — только из webview
  контекста (cookies/челлендж). Не обходить DRM.
- Не менять чужие модули без необходимости; контракты API — в `src/api/types.ts`.
- Изменения — через OpenSpec-изменения (`openspec/changes/`).
- Не коммитить: node_modules/, dist/, target/, graphify-out/, .DS_Store.
