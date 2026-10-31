## 1. Каркас (app-shell)

- [ ] 1.1 Создать Tauri 2 проект: `src-tauri/` (Rust) + frontend (TS/Vite), иконки, tauri.conf.json
- [ ] 1.2 Layout: сайдбар (Главная/Поиск/Коллекция/Плейлисты/Подкасты) + нижний плеер-бар + контент
- [ ] 1.3 Проверить `cargo tauri dev` и сборку .app на macOS (реальный запуск)

## 2. Авторизация (auth)

- [ ] 2.1 Auth-окно webview с потоком id.zvuk.com; обработка WAF-челленджа
- [ ] 2.2 Извлечение токена из `/api/tiny/profile`, сохранение в Keychain (crate keyring)
- [ ] 2.3 Восстановление сессии при старте; refresh через `/web-api/v2/token/refresh` при 401
- [ ] 2.4 Реальная проверка: вход своим аккаунтом, перезапуск без повторного ввода

## 3. API-клиент (api-client)

- [ ] 3.1 Типизированный GraphQL-клиент из webview-контекста (cookies + X-Auth-Token + x-app-name)
- [ ] 3.2 Реализовать операции для MVP: getSearch*, getPlaylist*, getReleases*, getArtist*,
      getPaginatedCollection*, addItemToCollection/removeItemFromCollection, getRadioBy*,
      getPodcast*, getEpisodes, getStream, getListeningRecent, волны (getAvailableWaves/waveContent)
- [ ] 3.3 Tiny API: profile, grid, grid/content, musixmatch/lyrics, featured/info
- [ ] 3.4 Обработка ошибок: 401 → refresh; антибот-блокировка → диагностика (без тиров)
- [ ] 3.5 Снапшот-тесты схем ответов на живом аккаунте

## 4. Каталог и коллекция (catalog, collection)

- [ ] 4.1 Экран поиска: autocomplete + блочный результат (треки/артисты/релизы/плейлисты/подкасты)
- [ ] 4.2 Экран релиза: треклист, play/queue
- [ ] 4.3 Экран артиста: популярные треки, релизы, похожие
- [ ] 4.4 Экран плейлиста: инфо + треки
- [ ] 4.5 Экран подкаста: эпизоды, проигрывание эпизодов
- [ ] 4.6 Коллекция: лайкнутые треки/релизы/артисты/плейлисты, лайки с оптимистичным UI

## 5. Лента (feed)

- [ ] 5.1 Главная: grid-блоки, персональные подборки, волны
- [ ] 5.2 Радио по треку/релизу/артисту/плейлисту

## 6. Плеер (player)

- [ ] 6.1 HTML5 Audio движок в webview + команда Tauri на воспроизведение stream-URL
- [ ] 6.2 Очередь: next/prev, shuffle, repeat (off/all/one), «играть следующим», история
- [ ] 6.3 Seek, отображение позиции; refresh expire-URL на подлёте
- [ ] 6.4 Выбор качества hq/hifi (по is_flac_quality профиля)
- [ ] 6.5 Тексты песен (musixmatch lyrics)

## 7. Системная интеграция (system-integration)

- [ ] 7.1 Media keys + MPNowPlayingInfoCenter (обложка, название, seek)
- [ ] 7.2 Dock-состояние; иконка меню-бара с play/pause/next/prev

## 8. Качество и поставка

- [ ] 8.1 Индекс Graphify/CodeGraph/tgrep по репозиторию; правила в AGENTS.md
- [ ] 8.2 CI-скрипты: fmt/clippy/test; сборка .app/.dmg (codesign — по наличию сертификата)
- [ ] 8.3 README: установка, вход, ограничения, юридическая заметка
