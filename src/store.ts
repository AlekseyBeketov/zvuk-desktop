import type { Track, Profile } from "./api/types";

export interface QueueEntry {
  track: Track;
  // источник, куда добавили трек (например, id релиза/плейлиста) — для контекста
  source?: string;
}

export type RepeatMode = "off" | "all" | "one";

/**
 * Глобальное состояние приложения + шина событий.
 * Плеер (audio-элемент), media keys и UI слушают события store.
 */
export class AppStore extends EventTarget {
  token: string = "";
  profile: Profile | null = null;

  queue: QueueEntry[] = [];
  currentIndex: number = -1;
  isPlaying: boolean = false;
  shuffle: boolean = false;
  repeat: RepeatMode = "off";
  volume: number = 1;

  private _current(): QueueEntry | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) return null;
    return this.queue[this.currentIndex];
  }
  get current(): QueueEntry | null {
    return this._current();
  }

  /** Установить новую очередь и начать воспроизведение с startIndex. */
  playQueue(items: QueueEntry[], startIndex: number) {
    this.queue = items;
    this.currentIndex = Math.max(0, Math.min(startIndex, items.length - 1));
    this.isPlaying = true;
    this.emit("queue");
    this.emit("track");
    this.emit("playing");
  }

  /** Добавить треки в конец очереди (не меняя текущий). */
  enqueue(items: QueueEntry[]) {
    this.queue.push(...items);
    this.emit("queue");
  }

  playAt(i: number) {
    this.currentIndex = (i + this.queue.length) % this.queue.length;
    this.isPlaying = true;
    this.emit("track");
    this.emit("playing");
  }

  toggle() {
    this.isPlaying = !this.isPlaying;
    this.emit("playing");
  }

  next() {
    if (this.queue.length === 0) return;
    let i = this.currentIndex + 1;
    if (i >= this.queue.length) {
      if (this.repeat === "all") i = 0;
      else return;
    }
    this.playAt(i);
  }

  prev() {
    if (this.queue.length === 0) return;
    let i = this.currentIndex - 1;
    if (i < 0) i = this.queue.length - 1;
    this.playAt(i);
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    this.emit("mode");
  }
  cycleRepeat() {
    const order: RepeatMode[] = ["off", "all", "one"];
    this.repeat = order[(order.indexOf(this.repeat) + 1) % 3];
    this.emit("mode");
  }
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.emit("volume");
  }

  private emit(e: string) {
    this.dispatchEvent(new CustomEvent(e, { detail: this }));
  }
}

export const store = new AppStore();
