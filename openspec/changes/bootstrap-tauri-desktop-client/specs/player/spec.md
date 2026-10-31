## ADDED Requirements

### Requirement: Воспроизведение потока
Аудио-движок воспроизводит stream-URL из `getStream` (AAC/hq, при подписке flac/hifi),
с поддержкой seeks и с refreshing expire-URL при долгом воспроизведении.

#### Scenario: Воспроизведение
- **WHEN** трек запущен
- **THEN** звук играет, позиция/длительность отображаются, seek работает

#### Scenario: Истечение stream-URL
- **WHEN** stream-URL истекает во время воспроизведения
- **THEN** приложение незаметно получает новый URL и продолжает воспроизведение с той же позиции

### Requirement: Очередь и режимы
Очередь: next/prev, shuffle, repeat (off/all/one), вставка «дальше», история
(`getListeningRecent`, `getMostListenedTrack`).

#### Scenario: Shuffle
- **WHEN** пользователь включает shuffle в очереди
- **THEN** порядок перемешивается, повторное нажатие возвращает исходный порядок

### Requirement: Выбор качества
Если у профиля flac-доступен (`is_flac_quality`), пользователь может выбрать hifi/hq в настройках.

#### Scenario: Переключение качества
- **WHEN** пользователь переключает качество на hifi (при активной подписке)
- **THEN** следующие потоки запрашиваются с quality=hifi
