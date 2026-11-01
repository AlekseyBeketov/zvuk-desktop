import { invoke } from "@tauri-apps/api/core";
import { store } from "../store";
import type {
  CollectionPage,
  Episode,
  HomeBlock,
  Playlist,
  PlaylistPage,
  Podcast,
  Profile,
  ReleasePage,
  ArtistPage,
  SearchResults,
  StreamInfo,
  Track,
} from "./types";

/**
 * API-клиент Zvuk.
 *
 * Центральная сложность: WAF Servicepipe защищает zvuk.com JS-челленджем, поэтому
 * ВСЕ запросы должны выполняться из webview-контекста ('credentials: include'),
 * чтобы cookies/челлендж проходили как в PWA. Токен ставится заголовком X-Auth-Token;
 * при 401 — refresh через /web-api/v2/token/refresh и повтор.
 *
 * Эндпоинты (подтверждены по бандлу, см. docs/research/zvuk-api-open-source.md):
 *  - POST /api/v1/graphql           — каталог/поиск/коллекция/стримы (GraphQL)
 *  - GET  /api/tiny/profile         — профиль + токен
 *  - GET  /api/tiny/grid, /content  — главная лента
 *  - GET  /api/tiny/musixmatch/lyrics
 *  - POST /web-api/v2/token/refresh — обновление токена
 */
const GRAPHQL = "https://zvuk.com/api/v1/graphql";
const TINY_PROFILE = "https://zvuk.com/api/tiny/profile";

let refreshPromise: Promise<string | null> | null = null;

function setToken(t: string) {
  store.token = t;
}

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    if (!store.token) return null;
    const res = await fetch("https://zvuk.com/web-api/v2/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": store.token },
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const token: string = json?.token ?? json?.access_token ?? null;
    if (token) {
      setToken(token);
      await invoke("save_credentials", { token, refreshToken: null }).catch(() => {});
    }
    return token;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

/** POST запрос к API из webview-контекста; повтор после refresh при 401. */
async function post(path: string, body: unknown, useGraphql = false): Promise<any> {
  const doFetch = async (): Promise<any> => {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": store.token,
        "x-app-name": "web",
        ...(useGraphql ? {} : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      const fresh = await refreshToken();
      if (fresh) {
        const retry = await fetch(path, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": store.token,
            "x-app-name": "web",
          },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (retry.ok) return retry.json();
      }
      throw new Error("AUTH_REQUIRED");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  return doFetch();
}

/** GraphQL-запрос по имени операции + переменным (документы в operations.ts). */
async function gql(operationName: string, variables: Record<string, unknown>): Promise<any> {
  const { documents } = await import("./operations");
  const doc = documents[operationName];
  if (!doc) throw new Error(`Unknown operation ${operationName}`);
  return post(GRAPHQL, { query: doc, operationName, variables }, true);
}

/* ------------------------------------------------------------------ */
/* Авторизация и профиль                                                */
/* ------------------------------------------------------------------ */

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
    const res = await fetch(TINY_PROFILE, {
      headers: { "X-Auth-Token": store.token, "x-app-name": "web" },
      credentials: "include",
    });
    if (res.status === 401) {
      const fresh = await refreshToken();
      if (!fresh) return null;
    }
    if (!res.ok) return null;
    const json = await res.json();
    store.profile = json?.profile ?? json ?? null;
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
/* Контракт каталога/потоков — реализуется через GraphQL-операции       */
/* (документы и точное маппирование полей — см. operations.ts).         */
/* ------------------------------------------------------------------ */

export async function getHome(): Promise<HomeBlock[]> {
  const data = await gql("getTrackFeed", {});
  void data;
  // TODO(api): распарсить waves/feed/блоки из data; пока отдаём пусто.
  return [];
}

export async function searchAll(queryText: string): Promise<SearchResults> {
  const data = await gql("getSearchTracks", { text: queryText, first: 12 });
  void data;
  // TODO(api): свести getSearchTracks/Artists/Releases/Playlists/Podcasts.
  return { tracks: [], artists: [], releases: [], playlists: [], podcasts: [] };
}

export async function getRelease(id: string): Promise<ReleasePage> {
  const data = await gql("getReleasesTracks", { ids: [id] });
  void data;
  return { id, tracks: [] };
}

export async function getArtist(id: string): Promise<ArtistPage> {
  const data = await gql("getArtistPopularTracks", { id, first: 20 });
  void data;
  return { id, popularTracks: [], releases: [], related: [] };
}

export async function getMyPlaylists(): Promise<Playlist[]> {
  const data = await gql("getPlaylistsProfile", {});
  void data;
  return [];
}

export async function getPlaylist(id: string): Promise<PlaylistPage> {
  const data = await gql("getPlaylistTracks", { id });
  void data;
  return { id, tracks: [] };
}

export async function getPodcasts(): Promise<Podcast[]> {
  const data = await gql("getPodcasts", { first: 20 });
  void data;
  return [];
}

export async function getEpisodes(id: string): Promise<Episode[]> {
  const data = await gql("getEpisodes", { id, first: 50 });
  void data;
  return [];
}

export async function getCollection(): Promise<CollectionPage> {
  const data = await gql("getPaginatedCollection", { first: 50 });
  void data;
  return { tracks: [], releases: [], artists: [], playlists: [] };
}

export async function likeTrack(id: string, like: boolean): Promise<void> {
  const op = like ? "addItemToCollection" : "removeItemFromCollection";
  await gql(op, { id, type: "Track" });
}

export async function getStream(track: Track, quality?: "hq" | "hifi"): Promise<StreamInfo | null> {
  const data = await gql("getStream", {
    ids: [track.id],
    quality: quality ?? "hq",
    encodeType: "wv",
    isWeb: true,
  });
  const media = data?.mediaContents?.[0];
  const stream = media?.stream;
  if (stream?.url) return { url: stream.url, expire: stream.expire };
  return null;
}
