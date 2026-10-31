## ADDED Requirements

### Requirement: Поиск
Экран поиска: autocomplete (`getSearchAutocomplete`, `getPopularSearches`) и блочный поиск
(`getSearchTracks/Artists/Releases/Playlists/Podcasts/Episodes/Books`, `getBlendedSearch`).

#### Scenario: Поиск трека
- **WHEN** пользователь вводит запрос и нажимает Enter
- **THEN** показываются секции: треки, исполнители, релизы, плейлисты, подкасты; трек можно запустить

### Requirement: Экран релиза и артиста
Экран релиза: обложка, треклист (`getReleasesTracks`), запуск/очередь. Экран артиста:
популярные треки, релизы (`getArtistReleases`, `getArtistCursorPopularTracks`), похожие артисты.

#### Scenario: Открытие релиза
- **WHEN** пользователь кликает на релиз
- **THEN** открывается экран с треклистом; каждый трек проигрывается, весь релиз ставится в очередь

### Requirement: Плейлисты и подкасты
Экран плейлиста (`getPlaylistInfo`, `getPlaylistTracks`), подкасты (`getPodcasts`,
`getPodcastEpisodes`), эпизоды проигрываются как треки.

#### Scenario: Открытие подкаста
- **WHEN** пользователь открывает подкаст
- **THEN** показывается список эпизодов с длительностью и описанием, эпизод запускается
