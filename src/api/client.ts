import { invoke } from "@tauri-apps/api/core";
import { store } from "../store";
import type {
  Artist,
  CollectionPage,
  Episode,
  HomeBlock,
  Playlist,
  PlaylistPage,
  Podcast,
  Profile,
  Release,
  ReleasePage,
  ArtistPage,
  SearchResults,
  StreamInfo,
  Track,
} from "./types";

/**
 * API-клиент Zvuk.
 *
 * Архитектура сети (см. openspec design.md D1v2): WAF Servicepipe привязан к
 * TLS-отпечатку клиента, поэтому ВСЕ запросы выполняются в worker-webview
 * (скрытое окно на zvuk.com: same-origin fetch, cookies, настоящий WebKit).
 * Rust-команда api_fetch — мост; фронт не ходит в сеть сам.
 *
 * Эндпоинты (docs/research/zvuk-api-open-source.md):
 *  - POST /api/v1/graphql           — каталог/поиск/коллекция/стримы
 *  - GET  /api/tiny/profile         — профиль + токен
 *  - GET  /api/tiny/musixmatch/lyrics
 *  - POST /web-api/v2/token/refresh — обновление токена
 */
const GRAPHQL = "https://zvuk.com/api/v1/graphql";
const TINY_PROFILE = "https://zvuk.com/api/tiny/profile";
const TOKEN_REFRESH = "https://zvuk.com/web-api/v2/token/refresh";

let refreshPromise: Promise<string | null> | null = null;

function setToken(t: string) {
  store.token = t;
}

/** Базовый вызов через Rust-прокси (worker-webview). */
async function call(method: "GET" | "POST", url: string, body?: unknown): Promise<any> {
  return invoke("api_fetch", {
    method,
    url,
    body: body === undefined ? null : body,
  });
}

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const json = await call("POST", TOKEN_REFRESH, {});
      const token: string | null = json?.token ?? json?.access_token ?? null;
      if (token) {
        setToken(token);
        await invoke("save_credentials", { token, refreshToken: null }).catch(() => {});
      }
      return token;
    } catch {
      return null;
    }
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

/** POST с авто-refresh при 401 и одним повтором. */
async function post(path: string, body: unknown): Promise<any> {
  try {
    return await call("POST", path, body);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("HTTP 401")) {
      const fresh = await refreshToken();
      if (fresh) return call("POST", path, body);
      throw new Error("AUTH_REQUIRED");
    }
    throw e;
  }
}

/** GraphQL-запрос по имени операции + переменным (документы в operations.ts). */
async function gql(operationName: string, variables: Record<string, unknown>): Promise<any> {
  const { documents } = await import("./operations");
  const doc = documents[operationName];
  if (!doc) throw new Error(`Unknown operation ${operationName}`);
  return post(GRAPHQL, { query: doc, operationName, variables });
}

/* ------------------------------------------------------------------ */
/* Авторизация и профиль                                                */
/* ------------------------------------------------------------------ */

/** Открыть окно логина (вход через Sber ID внутри приложения). */
export function openLogin(): Promise<void> {
  return invoke("open_login").then(() => undefined);
}

/** Проверить сохранённый в Keychain токен; вернуть профиль или null. */
export async function loadStoredCredentials(): Promise<Profile | null> {
  const creds = (await invoke<Record<string, unknown>>("get_credentials").catch(() => ({} as Record<string, unknown>))) ?? {};
  const token = typeof creds.token === "string" ? creds.token : undefined;
  if (!token) return null;
  setToken(token);
  return fetchProfile();
}

/** Сохранить введённый вручную токен и вернуть профиль. */
export async function loginWithToken(token: string): Promise<Profile | null> {
  setToken(token.trim());
  const profile = await fetchProfile();
  if (profile) {
    await invoke("save_credentials", { token: store.token, refreshToken: null });
  }
  return profile;
}

export async function fetchProfile(): Promise<Profile | null> {
  try {
    const json = await call("GET", TINY_PROFILE);
    store.profile = (json?.result ?? json?.profile ?? json) ?? null;
    return store.profile;
  } catch {
    return null;
  }
}

export async function logout() {
  await invoke("clear_credentials").catch(() => {});
  setToken("");
  store.profile = null;
}

/* ------------------------------------------------------------------ */
/* Контракт каталога/потоков — GraphQL через operations.ts.            */
/* Ответы могут приходить как {data:{op:...}}, {data:{...}} или {...};
 * используется терпимый accessor (unpack/pick). Точные имена полей API
 * нестабильны — живую сверку см. в openspec (задача 3.5).               */
/* ------------------------------------------------------------------ */

function unpack(raw: unknown, path: string[]): unknown {
  // 1) {data: {<anything>: final}}
  const d = (raw as any)?.data;
  const src = d && typeof d === "object" && !Array.isArray(d) ? d : raw;
  let cur: any = src;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[key];
  }
  return cur;
}

function toArr<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  // иногда результат — {items:[...]} или {tracks:[...]}; берём первый массив
  if (v && typeof v === "object") {
    for (const k of Object.values(v as Record<string, unknown>)) {
      if (Array.isArray(k)) return k as T[];
    }
  }
  return [];
}

const imgOf = (o: any) => (o?.image?.src ? { src: o.image.src } : undefined);
const trackOf = (o: any): Track => ({
  id: String(o?.id ?? ""),
  title: o?.title ?? o?.name,
  artist: o?.artist ?? o?.artistName,
  artistName: o?.artistName ?? o?.artist,
  release: o?.release ? { id: String(o.release.id ?? ""), title: o.release.title, image: imgOf(o.release) } : undefined,
  image: imgOf(o),
  duration: typeof o?.duration === "number" ? o.duration : undefined,
  isInCollection: o?.isInCollection ?? o?.inCollection,
});
const releaseOf = (o: any): Release => ({
  id: String(o?.id ?? ""),
  title: o?.title ?? o?.name,
  artists: o?.artist ?? o?.artists ?? o?.artistName,
  image: imgOf(o),
  type: o?.type,
  year: o?.year,
});
const playlistOf = (o: any): Playlist => ({
  id: String(o?.id ?? ""),
  title: o?.title,
  description: o?.description,
  image: imgOf(o),
  tracksCount: o?.tracksCount ?? o?.tracks_count,
});
const artistOf = (o: any): Artist => ({ id: String(o?.id ?? ""), name: o?.name, image: imgOf(o) });
const podcastOf = (o: any): Podcast => ({ id: String(o?.id ?? ""), title: o?.title, description: o?.description, image: imgOf(o) });
const episodeOf = (o: any): Episode => ({
  id: String(o?.id ?? ""),
  title: o?.title,
  description: o?.description,
  duration: typeof o?.duration === "number" ? o.duration : undefined,
  image: imgOf(o),
});

export async function getHome(): Promise<HomeBlock[]> {
  const raw = await gql("getTrackFeed", {});
  const blocks: HomeBlock[] = [];
  // Перебираем массив контейнеров/блоков из data.getTrackFeed (формы разные)
  const feed: any[] = toArr(unpack(raw, ["getTrackFeed"]));
  for (const b of feed) {
    const releases = toArr<Release>(b?.releases).map(releaseOf);
    const playlists = toArr<Playlist>(b?.playlists).map(playlistOf);
    const tracks = toArr<Track>(b?.tracks).map(trackOf);
    if (releases.length || playlists.length || tracks.length) {
      blocks.push({
        title: b?.title ?? b?.name,
        releases,
        playlists,
        tracks,
      });
    }
  }
  return blocks;
}

export async function searchAll(queryText: string): Promise<SearchResults> {
  const [t, a, r, p, pd] = await Promise.all([
    gql("getSearchTracks", { text: queryText, first: 12 }),
    gql("getSearchArtists", { text: queryText, first: 12 }),
    gql("getSearchReleases", { text: queryText, first: 12 }),
    gql("getSearchPlaylists", { text: queryText, first: 12 }),
    gql("getSearchPodcasts", { text: queryText, first: 12 }),
  ]).catch(() => [] as unknown[]);
  return {
    tracks: toArr(unpack(t, ["getSearchTracks"])).map(trackOf),
    artists: toArr(unpack(a, ["getSearchArtists"])).map(artistOf),
    releases: toArr(unpack(r, ["getSearchReleases"])).map(releaseOf),
    playlists: toArr(unpack(p, ["getSearchPlaylists"])).map(playlistOf),
    podcasts: toArr(unpack(pd, ["getSearchPodcasts"])).map(podcastOf),
  };
}

export async function getRelease(id: string): Promise<ReleasePage> {
  const raw = await gql("getReleasesTracks", { ids: [id] });
  const info: any = unpack(raw, ["getReleasesTracks"]);
  const release: any = info?.release ?? info?.[0]?.release ?? itemInfo(info);
  return {
    id,
    title: release?.title ?? (info as any)?.title,
    artists: release?.artist ?? (info as any)?.artist,
    image: imgOf(release ?? info),
    type: (info as any)?.type,
    tracks: toArr<Track>(info?.tracks ?? info?.[0]?.tracks ?? itemTracks(info, raw)).map(trackOf),
  };
}
// вспомогательные: часть ответов — {result:{release:{…},tracks:[…]}}
const itemInfo = (o: any) => o?.result?.release ?? o?.result?.playlist ?? o;
const itemTracks = (o: any, raw: unknown) =>
  o?.result?.tracks ?? toArr(unpack(raw, ["getReleasesTracks", "tracks"])) ?? [];

export async function getArtist(id: string): Promise<ArtistPage> {
  const [p, rel] = await Promise.all([
    gql("getArtistPopularTracks", { id, first: 20 }),
    gql("getArtistReleases", { id, first: 20 }),
  ]).catch(() => [] as unknown[]);
  return {
    id,
    popularTracks: toArr(unpack(p, ["getArtistPopularTracks"])).map(trackOf),
    releases: toArr(unpack(rel, ["getArtistReleases"])).map(releaseOf),
    related: [],
  };
}

export async function getMyPlaylists(): Promise<Playlist[]> {
  const raw = await gql("getPlaylistsProfile", {});
  const val: any = unpack(raw, ["getPlaylistsProfile"]);
  return toArr<Playlist>(val?.playlists ?? val).map(playlistOf);
}

export async function getPlaylist(id: string): Promise<PlaylistPage> {
  const raw = await gql("getPlaylistTracks", { id });
  const val: any = unpack(raw, ["getPlaylistTracks"]);
  const info = val?.playlist ?? val?.[0]?.playlist ?? val;
  return {
    id,
    title: info?.title,
    description: info?.description,
    image: imgOf(info),
    tracksCount: info?.tracksCount,
    tracks: toArr<Track>(info?.tracks ?? val?.tracks).map(trackOf),
  };
}

export async function getPodcasts(): Promise<Podcast[]> {
  const raw = await gql("getPodcasts", { first: 20 });
  const val: any = unpack(raw, ["getPodcasts"]);
  return toArr<Podcast>(val?.podcasts ?? val).map(podcastOf);
}

export async function getEpisodes(id: string): Promise<Episode[]> {
  const raw = await gql("getEpisodes", { id, first: 50 });
  const val: any = unpack(raw, ["getEpisodes"]);
  return toArr<Episode>(val?.episodes ?? val).map(episodeOf);
}

export async function getCollection(): Promise<CollectionPage> {
  const raw = await gql("getPaginatedCollection", { first: 50 });
  const items: any[] = toArr(unpack(raw, ["getPaginatedCollection"]));
  const tracks: Track[] = [];
  const releases: Release[] = [];
  const artists: Artist[] = [];
  const playlists: Playlist[] = [];
  for (const it of items) {
    const t = String((it as any)?.type ?? (it as any)?.kind ?? "").toLowerCase();
    if (t.includes("track") || (it as any)?.duration != null) tracks.push(trackOf(it));
    else if (t.includes("artist")) artists.push(artistOf(it));
    else if (t.includes("playlist")) playlists.push(playlistOf(it));
    else releases.push(releaseOf(it));
  }
  return { tracks, releases, artists, playlists };
}

export async function likeTrack(id: string, like: boolean): Promise<void> {
  const op = like ? "addItemToCollection" : "removeItemFromCollection";
  await gql(op, { id, type: "Track" });
}

/** Тексты песен через Tiny API (Musixmatch). */
export async function getLyrics(trackId: string): Promise<string | null> {
  try {
    const json = await call(
      "GET",
      `https://zvuk.com/api/tiny/musixmatch/lyrics?trackId=${encodeURIComponent(trackId)}`
    );
    return json?.lyrics ?? json?.text ?? null;
  } catch {
    return null;
  }
}

export async function getStream(track: Track, quality?: "hq" | "hifi"): Promise<StreamInfo | null> {
  const data = await gql("getStream", {
    ids: [track.id],
    quality: quality ?? "hq",
    encodeType: "wv",
    isWeb: true,
  });
  const media = data?.data?.getStream?.[0] ?? data?.mediaContents?.[0] ?? data?.getStream?.[0];
  const stream = media?.stream;
  if (stream?.url) return { url: stream.url, expire: stream.expire };
  return null;
}

/** Радио по треку: получаем очередь через getRadioByTrack. */
export async function radioByTrack(trackId: string): Promise<Track[]> {
  const raw = await gql("getRadioByTrack", { id: trackId, first: 20 });
  const val: any = unpack(raw, ["getRadioByTrack"]);
  return toArr<Track>(val?.tracks ?? val).map(trackOf);
}

