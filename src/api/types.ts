/**
 * Типы данных Zvuk (Сбер Звук), восстановленные из GraphQL-контрактов веб-плеера.
 * Поля нестрогие (API меняется) — ключевые помечены. См. docs/research/zvuk-api-open-source.md.
 */
export interface ImageRef {
  src: string;
  [k: string]: unknown;
}

export interface Artist {
  id: string;
  name?: string;
  image?: ImageRef;
  [k: string]: unknown;
}

export interface AlbumRef {
  id: string;
  title?: string;
  image?: ImageRef;
  [k: string]: unknown;
}

export interface Track {
  id: string;
  title?: string;
  artist?: string;
  artistName?: string;
  release?: AlbumRef;
  image?: ImageRef;
  duration?: number;
  explicit?: boolean;
  isInCollection?: boolean;
  [k: string]: unknown;
}

export interface Release {
  id: string;
  title?: string;
  artists?: string;
  artistName?: string;
  image?: ImageRef;
  type?: string;
  year?: number;
  [k: string]: unknown;
}

export interface Playlist {
  id: string;
  title?: string;
  description?: string;
  image?: ImageRef;
  tracksCount?: number;
  [k: string]: unknown;
}

export interface Podcast {
  id: string;
  title?: string;
  description?: string;
  image?: ImageRef;
  [k: string]: unknown;
}

export interface Episode {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  image?: ImageRef;
  [k: string]: unknown;
}

export interface Profile {
  id: string;
  name?: string;
  email?: string;
  is_anonymous?: boolean;
  is_flac_quality?: boolean;
  subscription?: { type?: string; [k: string]: unknown };
  [k: string]: unknown;
}

/** Ответ getStream: временный URL потока с датой истечения. */
export interface StreamInfo {
  url: string;
  expire?: string;
  [k: string]: unknown;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  releases: Release[];
  playlists: Playlist[];
  podcasts: Podcast[];
}

/** Лента главной: именованные блоки подборок. */
export interface HomeBlock {
  title?: string;
  releases?: Release[];
  playlists?: Playlist[];
  tracks?: Track[];
  [k: string]: unknown;
}

export interface CollectionPage {
  tracks: Track[];
  releases: Release[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface PlaylistPage extends Playlist {
  tracks: Track[];
}

export interface ReleasePage extends Release {
  tracks: Track[];
}

export interface ArtistPage extends Artist {
  popularTracks: Track[];
  releases: Release[];
  related: Artist[];
}
