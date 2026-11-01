import type { Playlist, Release, Track, Artist, Podcast } from "../api/types";
import { store } from "../store";
import { getStream, likeTrack } from "../api/client";

/** Загружает поток для трека и ставит его (уже в очереди) на воспроизведение. */
export async function playTrackInStore(track: Track) {
  const s = await getStream(track).catch(() => null);
  // Сохраняем готовый URL на трек до попадания в очередь, чтобы audio сразу заиграл.
  (track as unknown as { _streamUrl?: string })._streamUrl = s?.url ?? "";
  const idx = store.queue.findIndex((e) => e.track.id === track.id);
  if (idx >= 0) {
    store.playAt(idx);
  } else {
    store.playQueue([{ track }], 0);
  }
}

export const n = (v: unknown) => (v == null || v === "" ? "—" : String(v));

const img = (src: string | undefined): string =>
  src
    ? `<img src="${src}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />`
    : `<div class="tile-imgph"></div>`;

/** Заголовок секции поиска/ленты. */
export function renderSectionTitle(text: string): HTMLElement {
  const h = document.createElement("div");
  h.className = "search-section-title";
  h.textContent = text;
  return h;
}

/** Сетка плиток по блокам ленты/подборок (releases, playlists, tracks, podcasts…) — строит секцию. */
export function buildGridSection(block: Record<string, unknown>, targetRoutePrefix = ""): HTMLElement {
  const title = (block.title as string) ?? "";
  const section = document.createElement("section");
  section.className = "section";
  if (title) {
    const h = document.createElement("div");
    h.className = "search-section-title";
    h.textContent = title;
    section.appendChild(h);
  }
  const grid = document.createElement("div");
  grid.className = "grid";

  const releases = (block.releases as Release[]) ?? [];
  const playlists = (block.playlists as Playlist[]) ?? [];
  const podcasts = (block.podcasts as Podcast[]) ?? [];
  const artists = (block.artists as Artist[]) ?? [];
  const items = [
    ...releases.map((r) => ({ title: r.title ?? "", sub: r.artists ?? "", img: r.image?.src, href: `${targetRoutePrefix}release/${r.id}` })),
    ...playlists.map((p) => ({ title: p.title ?? "", sub: `${p.tracksCount ?? 0} треков`, img: p.image?.src, href: `${targetRoutePrefix}playlist/${p.id}` })),
    ...podcasts.map((p) => ({ title: p.title ?? "", sub: "Подкаст", img: p.image?.src, href: `${targetRoutePrefix}podcast/${p.id}` })),
    ...artists.map((a) => ({ title: a.name ?? "", sub: "Исполнитель", img: a.image?.src, href: `${targetRoutePrefix}artist/${a.id}` })),
  ];
  for (const it of items) {
    const tile = document.createElement("a");
    tile.className = "tile";
    tile.href = `#${it.href}`;
    tile.innerHTML = `${img(it.img)}<div class="tile-title">${n(it.title)}</div><div class="tile-sub">${n(it.sub)}</div>`;
    grid.appendChild(tile);
  }
  section.appendChild(grid);
  return section;
}

/** Удобная обёртка: собрать секцию и вставить в host. */
export function renderTileGrid(host: HTMLElement, block: Record<string, unknown>, targetRoutePrefix = "") {
  host.appendChild(buildGridSection(block, targetRoutePrefix));
}

function fmtDur(sec: number | undefined): string {
  const total = Math.round(sec ?? 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Трек-лист: клик по строке — play; сердечко — лайк; играющий подсвечен. */
export function renderTracks(tracks: Track[]): HTMLElement {
  const list = document.createElement("div");
  list.className = "tracklist";
  tracks.forEach((track, i) => {
    const row = document.createElement("div");
    row.className = "track-row";
    const current = store.current?.track.id === track.id;
    if (current) row.classList.add("playing");
    row.innerHTML = `
      <span class="num">${current ? "▶" : i + 1}</span>
      <div>
        <div class="tt">${n(track.title)}</div>
        <div class="ts">${n(track.artistName ?? track.artist)}</div>
      </div>
      <button class="like ${track.isInCollection ? "on" : ""}" data-like="${track.id}" title="В коллекцию">♥</button>
      <span class="dur">${fmtDur(track.duration)}</span>`;
    row.addEventListener("click", () => {
      playTrackInStore(track);
    });
    const like = row.querySelector(".like") as HTMLButtonElement;
    like.addEventListener("click", async (e) => {
      e.stopPropagation();
      const liked = !track.isInCollection;
      track.isInCollection = liked;
      like.classList.toggle("on", liked);
      likeTrack(track.id, liked).catch(() => {});
    });
    list.appendChild(row);
  });
  return list;
}

/** Детальная шапка: обложка + заголовок + meta + кнопка "Слушать". */
export function renderHeader(host: HTMLElement, o: { title?: string; sub?: string; img?: string; onPlay?: () => void }) {
  const d = document.createElement("div");
  d.className = "detail";
  d.innerHTML = `
    ${o.img ? `<img class="cover" src="${o.img}" alt="" />` : `<div class="cover placeholder"></div>`}
    <div class="meta">
      <h1>${n(o.title)}</h1>
      <div class="sub">${n(o.sub)}</div>
      ${o.onPlay ? `<div class="actions"><button class="btn primary" data-play>Слушать</button></div>` : ""}
    </div>`;
  if (o.onPlay) {
    (d.querySelector("[data-play]") as HTMLElement).addEventListener("click", o.onPlay);
  }
  host.appendChild(d);
}
