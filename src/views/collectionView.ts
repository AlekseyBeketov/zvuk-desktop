import { getCollection } from "../api/client";
import { renderTracks } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Коллекция</h2><div class="empty">Загрузка…</div>`;
  const c = await getCollection().catch(() => null);
  if (!c) {
    host.innerHTML = `<h2>Коллекция</h2><div class="empty">Пусто</div>`;
    return;
  }
  host.innerHTML = `<h2>Коллекция</h2>`;
  if (c.tracks.length) host.appendChild(renderTracks(c.tracks));
  // TODO(views): секции релизов/артистов/плейлистов из коллекции.
}
