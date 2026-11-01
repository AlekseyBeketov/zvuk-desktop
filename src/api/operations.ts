/**
 * GraphQL-документы операций Zvuk.
 *
 * Документы реконструируются по AST из бандла веб-плеера
 * (tools/artifacts/zvuk-web/graphql_operations.txt + REA evidence).
 * ВАЖНО: точные имена полей/aliases надо сверять с живым API; здесь — рабочие
 * каркасы по операциям, подтверждённым в бандле. Имена операции должны
 * совпадать с именами в бандле (getSearchTracks, getStream и т.д.).
 */
export const documents: Record<string, string> = {
  getStream: `
    query getStream($ids: [ID!]!, $quality: Quality, $encodeType: EncodeType, $isWeb: Boolean) {
      mediaContents: getStream(ids: $ids, quality: $quality, encodeType: $encodeType, isWeb: $isWeb) {
        stream {
          url
          expire
        }
      }
    }
  `,
  getSearchTracks: `
    query getSearchTracks($text: String!, $first: Int) {
      getSearchTracks(text: $text, first: $first) {
        id
        title
        artist
        image { src }
        duration
      }
    }
  `,
  getSearchArtists: `
    query getSearchArtists($text: String!, $first: Int) {
      getSearchArtists(text: $text, first: $first) { id name image { src } }
    }
  `,
  getSearchReleases: `
    query getSearchReleases($text: String!, $first: Int) {
      getSearchReleases(text: $text, first: $first) { id title artist image { src } type year }
    }
  `,
  getSearchPlaylists: `
    query getSearchPlaylists($text: String!, $first: Int) {
      getSearchPlaylists(text: $text, first: $first) { id title description image { src } }
    }
  `,
  getSearchPodcasts: `
    query getSearchPodcasts($text: String!, $first: Int) {
      getSearchPodcasts(text: $text, first: $first) { id title description image { src } }
    }
  `,
  getReleasesTracks: `
    query getReleasesTracks($ids: [ID!]!) {
      getReleasesTracks(ids: $ids) {
        release { id }
        tracks { id title artist duration image { src } }
      }
    }
  `,
  getArtistPopularTracks: `
    query getArtistPopularTracks($id: ID!, $first: Int) {
      getArtistPopularTracks(id: $id, first: $first) {
        tracks { id title artist duration image { src } }
      }
    }
  `,
  getPlaylistsProfile: `
    query getPlaylistsProfile {
      getPlaylistsProfile {
        playlists { id title description tracksCount image { src } }
      }
    }
  `,
  getPlaylistTracks: `
    query getPlaylistTracks($id: ID!) {
      getPlaylistTracks(id: $id) {
        playlist { id title description image { src } }
        tracks { id title artist duration image { src } }
      }
    }
  `,
  getPodcasts: `
    query getPodcasts($first: Int) {
      getPodcasts(first: $first) { id title description image { src } }
    }
  `,
  getEpisodes: `
    query getEpisodes($id: ID!, $first: Int) {
      getEpisodes(id: $id, first: $first) { id title description duration }
    }
  `,
  getPaginatedCollection: `
    query getPaginatedCollection($first: Int) {
      getPaginatedCollection(first: $first) {
        items { id type title artist duration image { src } }
      }
    }
  `,
  getRadioByTrack: `
    query getRadioByTrack($id: ID!, $first: Int) {
      getRadioByTrack(id: $id, first: $first) {
        tracks { id title artist artistName duration image { src } }
      }
    }
  `,
  getArtistReleases: `
    query getArtistReleases($id: ID!, $first: Int) {
      getArtistReleases(id: $id, first: $first) {
        releases { id title artist image { src } type year }
      }
    }
  `,
  getSearchAutocomplete: `
    query getSearchAutocomplete($text: String!) {
      getSearchAutocomplete(text: $text) {
        items { id type title artist image { src } }
      }
    }
  `,
  addItemToCollection: `
    mutation addItemToCollection($id: ID!, $type: String!) {
      addItemToCollection(id: $id, type: $type) { id }
    }
  `,
  removeItemFromCollection: `
    mutation removeItemFromCollection($id: ID!, $type: String!) {
      removeItemFromCollection(id: $id, type: $type) { id }
    }
  `,
};
