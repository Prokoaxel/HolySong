import type { Folder, FolderSong, Song } from '../types'

const FOLDERS_BY_USER_KEY = 'holysong:folders-by-user:v1'
const FOLDER_DETAIL_MAP_KEY = 'holysong:folder-detail-map:v1'

type FoldersByUserMap = Record<string, Folder[]>

type CachedFolderDetail = {
  folderId: string
  folderName: string
  ownerId: string | null
  isOwner: boolean
  linkShareEnabled: boolean
  supportsLinkShare: boolean
  folderSongs: FolderSong[]
  allSongs: Song[]
  savedAt: number
}

type FolderDetailMap = Record<string, CachedFolderDetail>

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage)

export const cacheFoldersForUser = (userId: string, folders: Folder[]) => {
  if (!canUseStorage() || !userId) return
  try {
    const raw = window.localStorage.getItem(FOLDERS_BY_USER_KEY)
    const map = (raw ? JSON.parse(raw) : {}) as FoldersByUserMap
    map[userId] = folders
    window.localStorage.setItem(FOLDERS_BY_USER_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export const readCachedFoldersForUser = (userId: string): Folder[] => {
  if (!canUseStorage() || !userId) return []
  try {
    const raw = window.localStorage.getItem(FOLDERS_BY_USER_KEY)
    if (!raw) return []
    const map = JSON.parse(raw) as FoldersByUserMap
    return Array.isArray(map[userId]) ? map[userId] : []
  } catch {
    return []
  }
}

export const cacheFolderDetail = (detail: Omit<CachedFolderDetail, 'savedAt'>) => {
  if (!canUseStorage()) return
  try {
    const raw = window.localStorage.getItem(FOLDER_DETAIL_MAP_KEY)
    const map = (raw ? JSON.parse(raw) : {}) as FolderDetailMap
    map[detail.folderId] = {
      ...detail,
      savedAt: Date.now(),
    }
    window.localStorage.setItem(FOLDER_DETAIL_MAP_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export const readCachedFolderDetail = (folderId: string): CachedFolderDetail | null => {
  if (!canUseStorage() || !folderId) return null
  try {
    const raw = window.localStorage.getItem(FOLDER_DETAIL_MAP_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as FolderDetailMap
    return map[folderId] ?? null
  } catch {
    return null
  }
}
