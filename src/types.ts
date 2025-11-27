export type Song = {
  id: string
  title: string
  author?: string | null
  tone?: string | null
  content?: string | null
}

export type Folder = {
  id: string
  name: string
  owner_id?: string | null
}

export type FolderSong = {
  folder_id: string
  song_id: string
  custom_transpose: number
  songs?: Song
}

export type DbSong = {
  id: string
  title: string
  author: string | null
  tone: string | null
  content: string
}

export type DbVersion = {
  id: string
  song_id: string
  version_label: string
  tone: string | null
  content: string
  created_at: string
}

export type LiveSession = {
  id: string
  code: string
  owner_id: string | null
  current_song: string | null
  transpose: number
  capo: number
}

export type Role = 'none' | 'admin' | 'listener'

export type Comment = {
  id: string
  song_id: string
  version_id: string | null  // 'base' para versión principal, o ID de version
  user_id: string
  user_email: string
  text_selection: string
  comment_text: string
  position_start: number
  position_end: number
  created_at: string
  updated_at: string
}
