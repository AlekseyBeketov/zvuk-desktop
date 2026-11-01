import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { store } from "../store";

/**
 * Аудио-движок: HTML5 <audio> в webview (декодирует AAC/hq поток нативно),
 * привязан к store, обновляет Now Playing (macOS) и слушает media keys из Rust.
 * Модуль-синглтон: вызывать initPlayer() один раз при старте.
 */

let audio: HTMLAudioElement;
let seekbar: HTMLInputElement | null = null;

function pushNowPlaying() {
  const cur = store.current?.track;
  if (!cur) {
    invoke("set_now_playing", { meta: null }).catch(() => {});
    return;
  }
  invoke("set_now_playing", {
    meta: {
      title: cur.title ?? "",
      artist: cur.artistName ?? cur.artist ?? "",
      album: cur.release?.title ?? "",
      coverUrl: cur.image?.src ?? null,
      durationSecs: cur.duration && cur.duration > 0 ? cur.duration : null,
      positionSecs: audio.currentTime ? Math.floor(audio.currentTime) : 0,
      isPlaying: store.isPlaying,
    },
  }).catch(() => {});
}

export function initPlayer() {
  audio = document.getElementById("audio") as HTMLAudioElement;

  // store -> audio
  store.addEventListener("track", () => {
    const cur = store.current;
    if (!cur) return;
    // Текущий трек: stream-URL должны выдать в API-слое и записать в store?
    // URL приходит из прослойки api.getStream: здесь берём заранее сохранённый
    // на трек sourceUrl, если присутствует.
    const url = (cur.track as unknown as { _streamUrl?: string })._streamUrl;
    if (!url) return;
    audio.src = url;
    audio.currentTime = 0;
    pushNowPlaying();
  });
  store.addEventListener("playing", () => {
    if (store.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    pushNowPlaying();
  });
  store.addEventListener("volume", () => {
    audio.volume = Math.max(0, Math.min(1, store.volume));
  });
  store.addEventListener("queue", () => {});

  // audio -> store
  audio.addEventListener("ended", () => {
    if (store.repeat === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      store.next();
    }
  });
  audio.addEventListener("timeupdate", () => {
    if (seekbar) seekbar.value = String(audio.currentTime);
    if (audio.currentTime % 15 < 1) pushNowPlaying();
  });
  audio.addEventListener("play", () => { store.isPlaying = true; });
  audio.addEventListener("pause", () => { store.isPlaying = false; pushNowPlaying(); });

  // media keys (из Rust, souvlaki)
  listen("media-command", (e) => {
    const cmd = e.payload as string;
    if (cmd === "play") { store.isPlaying = true; audio.play().catch(() => {}); }
    else if (cmd === "pause") { store.isPlaying = false; audio.pause(); }
    else if (cmd === "toggle") store.toggle();
    else if (cmd === "next") store.next();
    else if (cmd === "prev") store.prev();
  }).catch(() => {});
  listen("media-shuffle", (e) => {
    store.shuffle = Boolean(e.payload);
  }).catch(() => {});
}

/** Установить готовый stream-URL для текущего трека и (опц.) начать играть. */
export function setCurrentStreamUrl(url: string) {
  const cur = store.current;
  if (!cur) return;
  (cur.track as unknown as { _streamUrl?: string })._streamUrl = url;
}

export function bindSeekbar(el: HTMLInputElement) {
  seekbar = el;
  el.addEventListener("input", () => {
    const t = Number(el.value);
    if (Number.isFinite(t) && audio) audio.currentTime = t;
  });
}
