# Zvuk API — контракты, восстановленные из веб-бандла

**Источник:** статический анализ бандла десктоп-версии веб-плеера Zvuk
(22 чанка, 3.7MB, `tools/artifacts/zvuk-web/chunks/`, снято с CDN 2026-10-31, версия веб-приложения v8.20.1).
Кросс-проверка: `docs/research/zvuk-ecosystem.md` (обзор сторонних клиентов).
Каждое утверждение — из кода бандла (grep-контекст) или из README сторонних проектов (помечено).

## 1. Хосты

| Хост | Назначение | Свидетельство |
|---|---|---|
| `zvuk.com` | веб-приложение (Next.js, desktop-вариант под `/desktop`, ассеты `desktop-static/`) | бандл, HTML `/desktop` |
| `api.zvuk.com` | API-хост (без WAF-челленджа, JSON 404 `{"error":"not_found"}`) | живой curl-проб 2026-10-31 |
| `cdn-new.zvuk.com` | статика/бандлы, обложки | HTML страницы |
| `cdn-image.zvuk.com` | изображения | бандл |
| `id.zvuk.com` | авторизация (redirect при истечении сессии) | бандл: «Перенаправлен в id.zvuk.com» |
| `scontent*.zvuk.com` | раздача потоков (ожидаемо; URL приходит в ответе `getStream`) | сторонние проекты, помечено как гипотеза до живой проверки |

## 2. Авторизация

- Заголовок **`X-Auth-Token`** — основной (20 упоминаний в бандле; devdmytro/sberzvuk-downloader прямо называет его обязательным).
- Токен профиля получается из **`/api/tiny/profile`** (подтверждено бандлом + trudenboy/zvuk-music, Murglar, oshokin/zvuk-grabber).
- Refresh: **`/web-api/v2/token/refresh`** (бандл, 3 копии кода RefreshTokenError), при 401 — редирект в id.zvuk.com.
- Сторонние проекты упоминают также cookie `auth` (zvuk-dl-rs) и различие анонимного/пользовательского токена (Aiving/sberzvuk-api). Профиль бывает `is_anonymous` (бандл).
- **WAF Servicepipe**: HTML и `/api/*` на zvuk.com закрыты JS-челленджем (live-пробы 2026-10-31: curl → 418, headless-браузер → капча `xpvnsulc`). API-вызовы должны идти из контекста, прошедшего челлендж (webview). Некоторые сторонние проекты упоминают антибот-блокировки потоков (changelog ma-provider-zvuk-music от 2026-10-07).
- Заголовок **`x-app-name`** присылается вместе с X-Auth-Token (бандл).

## 3. GraphQL

Эндпоинт **`/api/v1/graphql`**. Из бандла извлечены **115 именованных операций** (полный список:
`tools/artifacts/zvuk-web/graphql_operations.txt`). Ключевые группы:

- **Стрим**: `getStream` (variables: `ids: [ID!]!`, `quality`, `encodeType`), `getTrackStreamPreview`.
  Ответ содержит `mediaContents[].stream` с URL и датой `expire` (код плеера проверяет expire и перезапрашивает).
- **Поиск**: `getSearchAutocomplete`, `getPopularSearches`, `getBlendedSearch`, `getSearchTracks/Artists/Releases/Playlists/Podcasts/Episodes/Books`, `getSearchAuthorIds/ArtistIds/PodcastIds/BookIds`.
- **Каталог**: `getReleases`, `getReleasesTracks`, `getReleasesByGenre`, `getFullTrack`, `artist`, `getArtistPopularTracks`, `getArtistCursorPopularTracks`, `getArtistReleases`, `getArtistAlbumsWithProfile/Singles/Compilations`, `getRelatedTracks/Releases/Artists/Playlists/Podcasts`.
- **Плейлисты**: `createPlaylist`, `updatePlaylist`, `removePlaylist`, `getPlaylistInfo`, `getPlaylistTracks`, `getPlaylistIds`, `getPlaylistsProfile`, `getUserPlaylist`.
- **Коллекция/лайки**: `addItemToCollection`, `removeItemFromCollection`, `AddItemsToCollection`, `getPaginatedCollection*`, `getCollectionIds`, `getCollectionCount`, `getProfileCollection`, `getLikesCount`.
- **Лента/волны**: `getTrackFeed`, `getAvailableWaves`, `waveContent`, `getPersonalWave`, `kidsWaveContent`, `getRadioByTrack/Release/Artist/Playlist`, `getRadioStation`, `getRadioStationsList`.
- **Подкасты/книги**: `getPodcasts`, `getPodcastEpisodes`, `getEpisodes`, `getChapter(s)`, `getAudioBook`, `getBooksRecommendations`, `getRelatedBooks/Authors`.
- **Профиль/прочее**: `getProfileImage`, `setProfileSettings`, `getSubscriptions`, `getNotification(s)`, `getListeningRecent`, `getMostListenedTrack`, `getMusicRecommendations`.

## 4. Tiny API и прочее

- `/api/tiny/profile` — профиль + токен
- `/api/tiny/grid`, `/api/tiny/grid/content` — главная лента
- `/api/tiny/musixmatch/lyrics` — тексты песен (Musixmatch)
- `/api/featured/info`, `/api/cookieAPI` (YM UID), `/api/healthcheck`
- `/api/v1/clickstream-web` — телеметрия, `/api/v1/machine-feed-count`, `/api/v1/tag`

## 5. Качество звука

Из кода плеера бандла:
- `getStreamParams()` → `{ quality: isLosslessQualityEnabled ? "hifi" : "hq", encodeType: (платформа) ? "fp" : "wv", isWeb: true }`
- `getStreamPreview` по умолчанию использует `quality: "sq"`.
- Флаг подписки: `is_flac_quality` в профиле (protobuf-модель в бандле).
- Сторонние проекты (помечено): качества `mid`, `high`, `flac` (devdmytro); FLAC/MP3 320/MP3 128 с откатом (zvuk-dl-rs); MP3 128 без подписки, MP3 320/FLAC с Prime (справка Murglar).

## 6. Ограничения

- WAF/антибот на HTML и API (live-пробы 418); антибот-блокировки потоков упоминаются сторонними проектами.
- `deviceLimitExceeded` — отдельная ошибка плеера (лимит устройств, бандл).
- Stream-URL временные (`expire`), нужно обновлять перед/во время воспроизведения (бандл + derangedabbot/zvuk-yandex-station-player: нужны `Referer`, `Origin`, обычный `User-Agent`).
- DRM не обнаружен в исследованных источниках; контент защищён авторизацией+подпиской.

## 7. Открытые вопросы (проверка живым трафиком в webview)

1. Точный schema getStream: полный набор полей ответа, значения quality/encodeType для WKWebView.
2. Достаточно ли X-Auth-Token, или cookie тоже критичны для API на zvuk.com (для api.zvuk.com?).
3. Требования Referer/Origin/UA к запросам потока на scontent-хостах.
4. Реальный хост потока (scontent*) и формат URL (path-структура, подпись).
5. Поведение WAF внутри WKWebView: проходит ли челлендж без взаимодействия.
6. Rate limits API (заголовки X-RateLimit-* встречаются в бандле).
