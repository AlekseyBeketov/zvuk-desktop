## ADDED Requirements

### Requirement: GraphQL-клиент
Клиент выполняет операции к `/api/v1/graphql` (список операций — tools/artifacts/zvuk-web/graphql_operations.txt,
115 операций) с заголовками `X-Auth-Token` и `x-app-name`, из webview-контекста (cookies WAF).

#### Scenario: Запрос каталога
- **WHEN** frontend запрашивает данные (например, `getSearchTracks`)
- **THEN** запрос уходит из webview-контекста с валидными cookies/заголовками, ответ типизирован

### Requirement: Tiny API
Поддерживаются Tiny-эндпоинты: `/api/tiny/profile` (профиль+токен), `/api/tiny/grid`,
`/api/tiny/grid/content`, `/api/tiny/musixmatch/lyrics` (тексты), `/api/featured/info`.

#### Scenario: Профиль пользователя
- **WHEN** приложение стартует с валидным токеном
- **THEN** загружается профиль (`/api/tiny/profile`): имя, подписка, is_flac-флаг

### Requirement: Получение потока
Поток запрашивается GraphQL-операцией `getStream` с параметрами `ids`, `quality` (hq|hifi),
`encodeType`, `isWeb`; ответ содержит stream-URL с датой истечения (`expire`).

#### Scenario: Начало воспроизведения
- **WHEN** пользователь нажимает play на треке
- **THEN** получается свежий stream-URL (с учётом expire) и он передаётся в аудио-движок

### Requirement: Уважение к WAF
При блокировке WAF приложение показывает понятную ошибку и предлагает перезапустить сессию,
не пытаясь обходить защиту сервисом вне легитимного контекста webview.

#### Scenario: Антибот-блокировка
- **WHEN** API отвечает блокировкой антибота
- **THEN** пользователь видит диагностику и кнопку «Перевойти», а не тирайты запросов
