import { getMyPlaylists } from "../api/client";
import { buildGridSection } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Плейлисты</h2><div class="empty">Загрузка…</div>`;
  const playlists = await getMyPlaylists().catch(() => []);
  host.innerHTML = `<h2>Плейлисты</h2>`;
  if (!playlists.length) {
    host.innerHTML += `<div class="empty">Пусто</div>`;
    return;
  }
  // buildGridSection для плейлистов показывает количество треков в подписи.
  host.appendChild(buildGridSection({ title: "Мои плейлисты", playlists }));
}
