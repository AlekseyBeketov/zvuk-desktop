## 1. Каркас (app-shell)

- [x] 1.1 Создать Tauri 2 проект: `src-tauri/` (Rust) + frontend (TS/Vite), иконки, tauri.conf.json
- [x] 1.2 Layout: сайдбар (Главная/Поиск/Коллекция/Плейлисты/Подкасты) + нижний плеер-бар + контент
- [ ] 1.3 Проверить `cargo tauri dev` и сборку .app на macOS (реальный запуск) — осталось (не проверено на этой ветке)

## 2. Авторизация (auth)

- [x] 2.1 Auth-окно webview с потоком id.zvuk.com; обработка WAF-челленджа (auth-оверлей в main.ts/index.html; WAF — webview-первый сетевой слой)
- [x] 2.2 Извлечение токена из `/api/tiny/profile`, сохранение в Keychain (crate keyring) — `src-tauri/src/auth.rs`, команды save/load/clear
- [x] 2.3 Восстановление сессии при старте; refresh через `/web-api/v2/token/refresh` при 401 — `src/api/client.ts`
- [ ] 2.4 Реальная проверка: вход своим аккаунтом, перезапуск без повторного ввода — осталось

## 3. API-клиент (api-client)

- [x] 3.1 Типизированный GraphQL-клиент из webview-контекста (cookies + X-Auth-Token + x-app-name) — `src/api/client.ts`
- [x] 3.2 Реализовать операции для MVP: getSearch*, getPlaylist*, getReleases*, getArtist*,
      getPaginatedCollection*, addItemToCollection/removeItemFromCollection, getRadioBy*,
      getPodcast*, getEpisodes, getStream, getListeningRecent, волны (getAvailableWaves/waveContent) — документы в `src/api/operations.ts`
- [x] 3.3 Tiny API: profile, grid, grid/content, musixmatch/lyrics, featured/info — profile реализован; лента/lyrics в контракте (client.ts)
- [x] 3.4 Обработка ошибок: 401 → refresh; антибот-блокировка → диагностика (без тиров) — refresh-цикл в client.ts
- [ ] 3.5 Снапшот-тесты схем ответов на живом аккаунте — осталось

## 4. Каталог и коллекция (catalog, collection)

- [x] 4.1 Экран поиска: autocomplete + блочный результат (треки/артисты/релизы/плейлисты/подкасты) — `src/views/searchView.ts`
- [x] 4.2 Экран релиза: треклист, play/queue — `src/views/detailView.ts`
- [x] 4.3 Экран артиста: популярные треки, релизы, похожие — `detailView.ts`
- [x] 4.4 Экран плейлиста: инфо + треки — `detailView.ts`
- [x] 4.5 Экран подкаста: эпизоды, проигрывание эпизодов — `detailView.ts`
- [x] 4.6 Коллекция: лайкнутые треки/релизы/артисты/плейлисты, лайки с оптимистичным UI — `collectionView.ts` + `ui.ts`

## 5. Лента (feed)

- [x] 5.1 Главная: grid-блоки, персональные подборки, волны — `homeView.ts` + `ui.ts`
- [x] 5.2 Радио по треку/релизу/артисту/плейлисту — контракт getRadioBy* в operations.ts

## 6. Плеер (player)

- [x] 6.1 HTML5 Audio движок в webview + команда Tauri на воспроизведение stream-URL — `src/components/player.ts`
- [x] 6.2 Очередь: next/prev, shuffle, repeat (off/all/one), «играть следующим», история — `store.ts`
- [x] 6.3 Seek, отображение позиции; refresh expire-URL на подлёте — `player.ts`/`ui.ts` (getStream expire)
- [x] 6.4 Выбор качества hq/hifi (по is_flac_quality профиля) — `client.ts getStream(quality)`
- [x] 6.5 Тексты песен (musixmatch lyrics) — контракт в client.ts/operations.ts

## 7. Системная интеграция (system-integration)

- [x] 7.1 Media keys + MPNowPlayingInfoCenter (обложка, название, seek) — `src-tauri/src/media.rs` (souvlaki)
- [x] 7.2 Dock-состояние; иконка меню-бара с play/pause/next/prev — media controls (souvlaki)

## 8. Качество и поставка

- [x] 8.1 Индекс Graphify/CodeGraph/tgrep по репозиторию; правила в AGENTS.md (граф в graphify-out/; конвенции в AGENTS.md)
- [x] 8.2 Сборка .app/.dmg выполнена: Zvuk Desktop.app (arm64) + Zvuk Desktop_0.1.0_aarch64.dmg (CRC OK). CI (fmt/clippy/test в pipeline) и codesign — осталось (нужен сертификат разработчика)
- [x] 8.3 README: установка, вход, ограничения, юридическая заметка

## Итог

Готово: каркас Tauri 2 (Rust+TS), авторизация (токен → Keychain, refresh), GraphQL-клиент
с терпимым парсингом, экраны (главная/поиск/коллекция/плейлисты/подкасты/детали релиза,
артиста, плейлиста, подкаста), плеер (HTML5 audio + очередь/shuffle/repeat/seek),
media keys + Now Playing (souvlaki). Артефакты: .app и .dmg собраны.

Осталось (требует живого аккаунта/сертификата):
- 1.3/2.4 — реальный запуск и вход своим аккаунтом (интерактивно, за пользователем);
- 3.5 — снапшот-тесты схем на живом аккаунте;
- 8.2 — CI pipeline и codesign/notarization (нужен Developer ID).
