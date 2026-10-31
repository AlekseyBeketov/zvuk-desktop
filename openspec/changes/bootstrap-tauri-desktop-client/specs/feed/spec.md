## ADDED Requirements

### Requirement: Главная лента
Главная страница строится из grid-контента (`/api/tiny/grid`, `/api/tiny/grid/content`,
`getTrackFeed`, волны `getAvailableWaves`/`waveContent`/`getPersonalWave`).

#### Scenario: Первый запуск с сессией
- **WHEN** пользователь входит в приложение
- **THEN** на главной отображаются персональные подборки и волны; запуск волны включает поток рекомендаций

### Requirement: Радио по объекту
Радио/волна по треку, релизу, артисту, плейлисту (`getRadioByTrack/Release/Artist/Playlist`).

#### Scenario: Радио по треку
- **WHEN** пользователь выбирает «запустить радио» у трека
- **THEN** формируется очередь рекомендаций от текущего трека
