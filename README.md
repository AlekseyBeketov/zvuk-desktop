# Zvuk Desktop

Неофициальный десктоп-клиент [Zvuk (Сбер Звук)](https://zvuk.com) для macOS на
[Rust](https://www.rust-lang.org/) + [Tauri 2](https://tauri.app/) (нативный WKWebView).
Проект не имеет отношения к официальному приложению Zvuk.

> **Статус: экспериментальный / неофициальный.** Клиент собирается и работает,
> но API-контракты Zvuk нестабильны и восстанавливаются из веб-плеера,
> поэтому часть функциональности может отваливаться при изменениях сервиса.
> Подходит для ежедневного прослушивания, не является заменой подписки или
> официального продукта.

## Возможности

- Вход по токену `X-Auth-Token` из профиля аккаунта на zvuk.com; токен хранится в macOS Keychain
- Восстановление сессии при старте + авто-refresh токена через `/web-api/v2/token/refresh`
- Поиск (треки, исполнители, релизы, плейлисты, подкасты)
- Релизы, артисты, плейлисты, подкасты с эпизодами — детальные экраны
- Коллекция (лайки/избранное с оптимистичным UI)
- Главная: grid-блоки подборок
- Плеер: HTML5 Audio в webview, очередь, prev/next, shuffle, repeat (off/all/one), seek
- Качество потока hq/hifi (по `is_flac_quality` профиля)
- Медиа-клавиши и панель Now Playing (macOS), через `souvlaki`
- Тексты песен (musixmatch) — в плане

## Установка и сборка

Требования: [Rust](https://rustup.rs/) (stable), [Node.js](https://nodejs.org/) 18+ и npm.

```bash
npm install          # зависимости фронтенда и Tauri CLI
npm run tauri dev    # разработка (Vite + окно Tauri)
npm run tauri build  # сборка .app/.dmg в src-tauri/target/release/bundle/
```

Первый `tauri build` скачает и скомпилирует Rust-крейты (может занять несколько минут).
Приложение собирается только под macOS.

## Вход / авторизация

У официального клиента нет отдельного auth-flow: WAF Servicepipe закрывает API
zvuk.com JS-челленджем, поэтому все запросы идут из webview-контекста.

1. Откройте https://zvuk.com в браузере и войдите в аккаунт.
2. Откройте профиль: https://zvuk.com/profile (или Developer Tools → Application → API).
3. Скопируйте значение `X-Auth-Token` (он же `token` из `/api/tiny/profile`).
4. В приложении нажмите «Открыть zvuk.com» или вставьте токен в поле входа и нажмите «Войти».

Токен сохраняется в macOS Keychain (сервис `ru.zvuk.desktop`) и подставляется в
каждый запрос заголовком `X-Auth-Token`. При получении 401 клиент сам пытается
обновить токен через `/web-api/v2/token/refresh` и повторяет запрос.

## Ограничения

- **WAF / антибот:** API резолвится только из webview-контекста (как в PWA).
  Любой сетевой запрос вне webview (curl, headless) получит 418/челлендж —
  это защита сервиса, мы её не обходим.
- **Нестабильные контракты:** API Zvuk неофициальный, восстанавливается из
  бандла веб-плеера и меняется (по свидетельствам сторонних проектов ломался
  в 2025–2026). Часть функций может временно не работать.
- **Раздел «Атлас»** (подборки/спецпроекты Zvuk) не реализован.
- Только macOS; Windows/Linux — вне первой итерации.
- Загрузка контента на диск не поддерживается.

## Юридическая заметка

Проект **не связан** с ООО «Звук» / Сбер и не является официальным продуктом.
Все права на контент (аудио, обложки, метаданные) принадлежат Zvuk.
Приложение не обходит DRM и защиту контента; воспроизведение происходит в рамках
действующей подписки пользователя, как в обычном браузере/веб-плеере. Токен
доступа — учётные данные пользователя, используются только для его собственного
аккаунта. Используйте на свой риск; автор не несёт ответственности за последствия.

## Лицензия

MIT © Aleksey Beketov. Неофициальный клиент, создан в образовательных целях;
никак не одобрен и не аффилирован с владельцами сервиса Zvuk.

```
MIT License

Copyright (c) 2026 Aleksey Beketov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
