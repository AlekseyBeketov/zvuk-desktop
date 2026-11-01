import type { HomeBlock, Track } from "../api/types";
import { getHome } from "../api/client";
import { buildGridSection, renderTracks } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `<h2>Главная</h2><div class="empty">Загрузка…</div>`;
  const blocks: HomeBlock[] = await getHome().catch(() => []);
  if (!blocks.length) {
    host.innerHTML = `<h2>Главная</h2><div class="empty">Ничего не найдено</div>`;
    return;
  }
  host.innerHTML = `<h2>Главная</h2>`;
  for (const b of blocks) {
    if (b.tracks?.length) {
      // Лента треков — именованная секция с трек-листом.
      const sec = document.createElement("section");
      sec.className = "section";
      if (b.title) {
        const h = document.createElement("div");
        h.className = "search-section-title";
        h.textContent = b.title;
        sec.appendChild(h);
      }
      sec.appendChild(renderTracks(b.tracks as Track[]));
      host.appendChild(sec);
    } else {
      // Подборки/релизы/плейлисты — сеткой плиток.
      host.appendChild(buildGridSection(b));
    }
  }
}
