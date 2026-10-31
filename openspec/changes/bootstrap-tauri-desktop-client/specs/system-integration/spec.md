## ADDED Requirements

### Requirement: Media keys и Now Playing
Аппаратные media keys (F7-F9) и Now Playing (MPNowPlayingInfoCenter) управляют плеером:
play/pause, next/prev, seek; обложка и название трека видны в системном UI.

#### Scenario: Media keys
- **WHEN** пользователь нажимает play/pause на клавиатуре при свёрнутом приложении
- **THEN** воспроизведение переключается, Now Playing обновляется

### Requirement: Дock и трей
Приложение показывает состояние в Dock (запущено/играет); опционально — иконку в меню-баре
с базовым управлением (play/pause/next/prev).

#### Scenario: Управление из трея
- **WHEN** пользователь кликает по иконке в меню-баре и выбирает next
- **THEN** включается следующий трек очереди
