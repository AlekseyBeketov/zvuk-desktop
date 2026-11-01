import { store } from "./store";
import { initPlayer, bindSeekbar } from "./components/player";
import * as api from "./api/client";
import * as homeView from "./views/homeView";
import * as searchView from "./views/searchView";
import * as collectionView from "./views/collectionView";
import * as playlistsView from "./views/playlistsView";
import * as podcastsView from "./views/podcastsView";
import * as settingsView from "./views/settingsView";
import * as detailView from "./views/detailView";

const views: Record<string, { render: (h: HTMLElement) => Promise<void> }> = {
  home: homeView,
  search: searchView,
  collection: collectionView,
  playlists: playlistsView,
  podcasts: podcastsView,
  settings: settingsView,
};

const content = () => document.getElementById("content") as HTMLElement;
const playerBar = () => document.getElementById("player-bar") as HTMLElement;

let currentRoute = "";

async function navigate() {
  const hash = location.hash.replace(/^#\//, "") || "home";
  const [route, param] = hash.split("/");
  const host = content();
  host.scrollTop = 0;

  document.querySelectorAll(".nav-item[data-route]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-route") === route);
  });

  if (route === "logout") {
    await api.logout();
    showAuth();
    return;
  }

  currentRoute = route;
  if (route === "home" || route === "search" || route === "collection" || route === "playlists" || route === "podcasts" || route === "settings") {
    await views[route].render(host);
  } else if (["release", "playlist", "podcast", "artist"].includes(route)) {
    await detailView.render(host, route, param ?? "");
  } else {
    host.innerHTML = `<div class="empty">Неизвестный раздел</div>`;
  }
  void currentRoute;
}

function renderPlayerBar() {
  const root = playerBar();
  const cur = store.current?.track;
  const repeatLabel =
    store.repeat === "one" ? "⟳ Один" : store.repeat === "all" ? "⟳ Все" : "⭯ Выкл";
  root.innerHTML = `
    <div class="pb-track">
      ${cur?.image?.src ? `<img src="${cur.image.src}" alt="" />` : `<div class="cover placeholder"></div>`}
      <div>
        <div class="name">${cur?.title ?? "—"}</div>
        <div class="artist">${cur?.artistName ?? cur?.artist ?? "Нет трека"}</div>
      </div>
    </div>
    <div class="pb-controls">
      <button class="pb-ctrl ${store.shuffle ? "active" : ""}" data-act="shuffle" title="Перемешать">⇄</button>
      <button class="pb-ctrl" data-act="prev" title="Назад">⏮</button>
      <button class="pb-ctrl main" data-act="toggle" title="Play/Pause">${store.isPlaying ? "⏸" : "▶"}</button>
      <button class="pb-ctrl" data-act="next" title="Вперёд">⏭</button>
      <button class="pb-ctrl ${store.repeat !== "off" ? "active" : ""}" data-act="repeat" title="Повтор">${store.repeat === "one" ? "⟳1" : "⟳"}</button>
    </div>
    <div class="pb-progress">
      <span id="pb-t"></span>
      <input id="pb-seek" type="range" min="0" max="1000" value="0" />
      <span id="pb-d"></span>
    </div>
    <div class="pb-repeat-label">${repeatLabel}</div>`;

  root.querySelectorAll(".pb-ctrl").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = (btn as HTMLElement).dataset.act;
      if (act === "toggle") store.toggle();
      else if (act === "next") store.next();
      else if (act === "prev") store.prev();
      else if (act === "shuffle") store.toggleShuffle();
      else if (act === "repeat") store.cycleRepeat();
    });
  });

  const seek = root.querySelector("#pb-seek") as HTMLInputElement;
  bindSeekbar(seek);

  const showTime = () => {
    const t = document.getElementById("pb-t");
    const d = document.getElementById("pb-d");
    const audio = document.getElementById("audio") as HTMLAudioElement;
    const fmt = (s: number) => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`;
    if (t && d) {
      t.textContent = fmt(audio?.currentTime ?? 0);
      d.textContent = fmt(cur?.duration ?? 0);
    }
  };
  store.addEventListener("track", showTime);
  setInterval(showTime, 500);
  renderPlayerBarLive(seek);
}

function renderPlayerBarLive(seek: HTMLInputElement) {
  const audio = document.getElementById("audio") as HTMLAudioElement;
  setInterval(() => {
    if (!audio.duration || Number.isNaN(audio.duration)) return;
    seek.max = String(Math.floor(audio.duration));
    seek.value = String(Math.floor(audio.currentTime));
  }, 500);
}

function showAuth() {
  document.getElementById("auth-overlay")!.classList.remove("hidden");
  document.getElementById("app")!.classList.add("hidden");
}

async function startApp() {
  initPlayer();
  bindAuthUI();
  document.getElementById("auth-overlay")!.classList.add("hidden");
  document.getElementById("app")!.classList.remove("hidden");
  window.addEventListener("hashchange", navigate);
  await navigate();
  renderPlayerBar();
  // Живое обновление кнопки play и метки режима повтора.
  store.addEventListener("playing", () => renderPlayerBar());
  store.addEventListener("track", renderPlayerBar);
  store.addEventListener("mode", renderPlayerBar);
}

function bindAuthUI() {
  document.getElementById("auth-open-browser")!.addEventListener("click", () => {
    // Вход происходит внутри окна приложения (Sber ID), WAF проходит нативно,
    // cookies остаются в cookie-store webview → Rust-прокси их использует.
    api.openLogin().catch((e) => {
      const status = document.getElementById("auth-status")!;
      status.textContent = `Не удалось открыть окно входа: ${e}`;
    });
  });
  document.getElementById("auth-save-token")!.addEventListener("click", async () => {
    const input = document.getElementById("auth-token-input") as HTMLInputElement;
    const status = document.getElementById("auth-status")!;
    if (!input.value.trim()) {
      status.textContent = "Введите токен";
      return;
    }
    status.textContent = "";
    const profile = await api.loginWithToken(input.value);
    if (!profile) {
      status.textContent = "Не удалось войти: проверьте токен (401/WAF/сеть).";
      return;
    }
    input.value = "";
    await startApp();
  });
  document.getElementById("logout")?.addEventListener("click", () => navigate());
}

window.addEventListener("DOMContentLoaded", async () => {
  let started = false;
  // Вход через окно приложения: Rust сохраняет токен в Keychain и шлёт login-success.
  const { listen } = await import("@tauri-apps/api/event");
  await listen("login-success", async () => {
    const profile = await api.loadStoredCredentials();
    if (profile && !started) {
      started = true;
      await startApp();
    }
  });
  const profile = await api.loadStoredCredentials();
  if (profile) {
    await startApp();
  } else {
    bindAuthUI();
    showAuth();
  }
});
