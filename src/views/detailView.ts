import type { Podcast } from "../api/types";
import * as api from "../api/client";
import { renderTracks, renderTileGrid, renderHeader } from "../components/ui";

/**
 * Детальные вьюхи: release/:id, playlist/:id, podcast/:id, artist/:id.
 * Субагент B реализует по контрактам API (getRelease/getPlaylist/getEpisodes/getArtist).
 */
export async function render(host: HTMLElement, kind: string, id: string) {
  host.innerHTML = `<div class="empty">Загрузка…</div>`;

  if (kind === "release") {
    const r = await api.getRelease(id).catch(() => null);
    if (!r) return host.innerHTML = `<div class="empty">Релиз не найден</div>`;
    host.innerHTML = "";
    renderHeader(host, { title: r.title, sub: r.artists, img: r.image?.src, onPlay: () => {
      if (r.tracks.length) storePlay(r.tracks.map((t) => ({ track: t })), 0);
    } });
    host.appendChild(renderTracks(r.tracks));
  } else if (kind === "playlist") {
    const p = await api.getPlaylist(id).catch(() => null);
    if (!p) return host.innerHTML = `<div class="empty">Плейлист не найден</div>`;
    host.innerHTML = "";
    renderHeader(host, { title: p.title, sub: p.description, img: p.image?.src, onPlay: () => {
      if (p.tracks.length) storePlay(p.tracks.map((t) => ({ track: t })), 0);
    } });
    host.appendChild(renderTracks(p.tracks));
  } else if (kind === "podcast") {
    const pod: Podcast = { id, title: "Подкаст" };
    const eps = await api.getEpisodes(id).catch(() => []);
    host.innerHTML = "";
    renderHeader(host, { title: pod.title, img: pod.image?.src });
    if (eps.length) host.appendChild(renderTracks(eps.map((e) => ({ id: e.id, title: e.title, duration: e.duration, image: e.image }))));
    else host.innerHTML += `<div class="empty">Эпизоды не найдены</div>`;
  } else if (kind === "artist") {
    const a = await api.getArtist(id).catch(() => null);
    if (!a) return host.innerHTML = `<div class="empty">Исполнитель не найден</div>`;
    host.innerHTML = "";
    renderHeader(host, { title: a.name, img: a.image?.src, onPlay: () => {
      if (a.popularTracks.length) storePlay(a.popularTracks.map((t) => ({ track: t })), 0);
    } });
    if (a.popularTracks.length) {
      const h = document.createElement("div");
      h.className = "search-section-title";
      h.textContent = "Популярное";
      host.appendChild(h);
      host.appendChild(renderTracks(a.popularTracks));
    }
    if (a.releases.length) renderTileGrid(host, { title: "Релизы", releases: a.releases });
    if (a.related.length) renderTileGrid(host, { title: "Похожие", artists: a.related });
  } else {
    host.innerHTML = `<div class="empty">Раздел не найден</div>`;
  }
}

function storePlay(items: { track: { id: string; title?: string; duration?: number; image?: { src?: string } | undefined } }[], start: number) {
  // Простейший запуск: первый трек через общий обработчик play.
  const first = items[start];
  if (!first) return;
  const t = first.track as never;
  import("../components/ui").then((u) => u.playTrackInStore(t));
}
