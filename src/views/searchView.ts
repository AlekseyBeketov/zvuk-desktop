import { searchAll } from "../api/client";
import { renderTracks, buildGridSection, renderSectionTitle } from "../components/ui";

function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export async function render(host: HTMLElement) {
  host.innerHTML = `
    <h2>Поиск</h2>
    <input id="search-q" class="search-input" placeholder="Треки, исполнители, релизы, плейлисты…" />
    <div id="search-results"></div>`;
  const input = host.querySelector("#search-q") as HTMLInputElement;
  const results = host.querySelector("#search-results") as HTMLElement;

  const run = async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      return;
    }
    const r = await searchAll(q).catch(() => null);
    if (!r || input.value.trim() !== q) return;
    results.innerHTML = "";
    let any = false;
    if (r.tracks.length) {
      results.appendChild(renderSectionTitle("Треки"));
      results.appendChild(renderTracks(r.tracks));
      any = true;
    }
    if (r.artists.length) { results.appendChild(buildGridSection({ title: "Исполнители", artists: r.artists })); any = true; }
    if (r.releases.length) { results.appendChild(buildGridSection({ title: "Релизы", releases: r.releases })); any = true; }
    if (r.playlists.length) { results.appendChild(buildGridSection({ title: "Плейлисты", playlists: r.playlists })); any = true; }
    if (r.podcasts.length) { results.appendChild(buildGridSection({ title: "Подкасты", podcasts: r.podcasts })); any = true; }
    if (!any) results.innerHTML = `<div class="empty">Ничего не найдено</div>`;
  };
  const onInput = debounce(run, 300);
  input.addEventListener("input", onInput);
}
