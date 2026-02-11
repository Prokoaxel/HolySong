import type { DbSong, Song } from '../types'

const SONG_LIST_KEY = 'holysong:song-list:v1'
const SONG_MAP_KEY = 'holysong:song-map:v1'

type SongMap = Record<string, DbSong>

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage)

export const cacheSongList = (songs: Song[]) => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(SONG_LIST_KEY, JSON.stringify({ savedAt: Date.now(), songs }))
  } catch (_e) {
    // ignore storage quota and private-mode errors
  }
}

export const readCachedSongList = (): Song[] => {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(SONG_LIST_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.songs) ? (parsed.songs as Song[]) : []
  } catch (_e) {
    return []
  }
}

export const cacheSongDetail = (song: DbSong) => {
  if (!canUseStorage()) return
  try {
    const raw = window.localStorage.getItem(SONG_MAP_KEY)
    const map = (raw ? JSON.parse(raw) : {}) as SongMap
    map[song.id] = song
    window.localStorage.setItem(SONG_MAP_KEY, JSON.stringify(map))
  } catch (_e) {
    // ignore storage errors
  }
}

export const readCachedSongDetail = (songId: string): DbSong | null => {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(SONG_MAP_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as SongMap
    return map[songId] ?? null
  } catch (_e) {
    return null
  }
}
