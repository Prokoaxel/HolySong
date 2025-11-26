import React from 'react'

type Folder = {
  id: string
  name: string
  song_count: number
}

type Props = {
  folders: Folder[]
  onOpen: (id: string) => void
}

const FolderList: React.FC<Props> = ({ folders, onOpen }) => (
  <div className="grid gap-4 md:grid-cols-3">
    {folders.map(f => (
      <button
        key={f.id}
        onClick={() => onOpen(f.id)}
        className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left hover:border-holysong.primary"
      >
        <p className="text-sm font-semibold mb-1">{f.name}</p>
        <p className="text-xs text-slate-400">{f.song_count} canciones</p>
      </button>
    ))}
  </div>
)

export default FolderList
