import type { Track } from "../api/types";
import * as api from "../api/client";
import { store } from "../store";
import { renderTracks, buildGridSection, renderHeader, playTrackInStore } from "../components/ui";

/**
 * Детальные вьюхи: release/:id, playlist/:id, podcast/:id, artist/:id.
 */
export async function render(host: HTMLElement, kind: string, id: string) {
  host.innerHTML = `<div class="empty">Загрузка…</div>`;

  if (kind === "release") {
    const r = await api.getRelease(id).catch(() => null);
    if (!r) return (host.innerHTML = `<div class="empty">Релиз не найден</div>`);
    const tracks = r.tracks ?? [];
    host.innerHTML = "";
    renderHeader(host, {
      title: r.title,
      sub: r.artists,
      img: r.image?.src,
      onPlay: () => startList(tracks),
    });
    if (tracks.length) host.appendChild(renderTracks(tracks));
    else host.innerHTML += `<div class="empty">Треки не найдены</div>`;
  } else if (kind === "playlist") {
    const p = await api.getPlaylist(id).catch(() => null);
    if (!p) return (host.innerHTML = `<div class="empty">Плейлист не найден</div>`);
    const tracks = p.tracks ?? [];
    host.innerHTML = "";
    renderHeader(host, {
      title: p.title,
      sub: p.description,
      img: p.image?.src,
      onPlay: () => startList(tracks),
    });
    if (tracks.length) host.appendChild(renderTracks(tracks));
    else host.innerHTML += `<div class="empty">Треки не найдены</div>`;
  } else if (kind === "podcast") {
    const eps = await api.getEpisodes(id).catch(() => []);
    host.innerHTML = "";
    renderHeader(host, { title: "Подкаст", img: undefined });
    if (eps.length) {
      const trs: Track[] = eps.map((e) => ({ id: e.id, title: e.title, duration: e.duration, image: e.image }));
      host.appendChild(renderTracks(trs));
    } else {
      host.innerHTML += `<div class="empty">Эпизоды не найдены</div>`;
    }
  } else if (kind === "artist") {
    const a = await api.getArtist(id).catch(() => null);
    if (!a) return (host.innerHTML = `<div class="empty">Исполнитель не найден</div>`);
    host.innerHTML = "";
    renderHeader(host, {
      title: a.name,
      img: a.image?.src,
      onPlay: () => startList(a.popularTracks ?? []),
    });
    if (a.popularTracks?.length) {
      const h = document.createElement("div");
      h.className = "search-section-title";
      h.textContent = "Популярное";
      host.appendChild(h);
      host.appendChild(renderTracks(a.popularTracks));
    }
    if (a.releases?.length) host.appendChild(buildGridSection({ title: "Релизы", releases: a.releases }));
    if (a.related?.length) host.appendChild(buildGridSection({ title: "Похожие", artists: a.related }));
  } else {
    host.innerHTML = `<div class="empty">Раздел не найден</div>`;
  }
}

/** Поставить ВСЕ треки в очередь и начать воспроизведение с первого. */
function startList(tracks: Track[]) {
  if (!tracks.length) return;
  store.playQueue(
    tracks.map((t) => ({ track: t })),
    0
  );
  // playTrackInStore сам получает поток и ставит его на воспроизведение.
  playTrackInStore(tracks[0]);
}
