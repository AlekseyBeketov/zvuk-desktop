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
  // Через поле podcasts buildGridSection строит плитки с подписью «Подкаст» и ссылкой #/podcast/:id.
  host.appendChild(buildGridSection({ title: "Подкасты", podcasts }));
}
