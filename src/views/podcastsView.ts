import { getPodcasts } from "../api/client";
import { buildGridSection } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Подкасты</h2><div class="empty">Загрузка…</div>`;
  const podcasts = await getPodcasts().catch(() => []);
  host.innerHTML = `<h2>Подкасты</h2>`;
  if (!podcasts.length) {
    host.innerHTML += `<div class="empty">Пусто</div>`;
    return;
  }
  host.appendChild(buildGridSection({ playlists: podcasts as never }));
}
