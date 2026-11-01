import { searchAll } from "../api/client";
import { renderTracks } from "../components/ui";

export async function render(host: HTMLElement) {
  host.innerHTML = `
    <h2>Поиск</h2>
    <input id="search-q" class="search-input" placeholder="Треки, исполнители, релизы, плейлисты…" />
    <div id="search-results"></div>`;
  const input = host.querySelector("#search-q") as HTMLInputElement;
  const results = host.querySelector("#search-results") as HTMLElement;
  let q = "";
  input.addEventListener("input", async () => {
    if (input.value.trim().length < 2) return;
    q = input.value.trim();
    const r = await searchAll(q).catch(() => null);
    if (!r || input.value.trim() !== q) return;
    results.innerHTML = "";
    if (r.tracks.length) {
      const h = document.createElement("div");
      h.className = "search-section-title";
      h.textContent = "Треки";
      results.appendChild(h);
      results.appendChild(renderTracks(r.tracks));
    }
    // TODO(views): секции артистов, релизов, плейлистов, подкастов.
    if (!r.tracks.length && !r.artists.length && !r.releases.length && !r.playlists.length && !r.podcasts.length) {
      results.innerHTML = `<div class="empty">Ничего не найдено</div>`;
    }
  });
}
