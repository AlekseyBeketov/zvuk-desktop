import { getCollection } from "../api/client";
import { renderTracks, buildGridSection } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Коллекция</h2><div class="empty">Загрузка…</div>`;
  const c = await getCollection().catch(() => null);
  if (!c) {
    host.innerHTML = `<h2>Коллекция</h2><div class="empty">Пусто</div>`;
    return;
  }
  host.innerHTML = `<h2>Коллекция</h2>`;
  if (c.tracks.length) host.appendChild(renderTracks(c.tracks));
  if (c.releases.length) host.appendChild(buildGridSection({ title: "Релизы", releases: c.releases }));
  if (c.artists.length) host.appendChild(buildGridSection({ title: "Исполнители", artists: c.artists }));
  if (c.playlists.length) host.appendChild(buildGridSection({ title: "Плейлисты", playlists: c.playlists }));
  if (!c.tracks.length && !c.releases.length && !c.artists.length && !c.playlists.length) {
    host.innerHTML += `<div class="empty">Пусто</div>`;
  }
}
