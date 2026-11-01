import type { HomeBlock } from "../api/types";
import { getHome } from "../api/client";
import { renderTileGrid } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Главная</h2><div class="empty">Загрузка…</div>`;
  const blocks: HomeBlock[] = await getHome().catch(() => []);
  if (!blocks.length) {
    host.innerHTML = `<h2>Главная</h2><div class="empty">Ничего не найдено</div>`;
    return;
  }
  host.innerHTML = `<h2>Главная</h2>`;
  for (const b of blocks) renderTileGrid(host, b);
}
