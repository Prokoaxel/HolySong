import React from 'react'

type Props = {
  title: string
  author: string
  composer: string
  tone: string
  coverUrl: string
  content: string
  onChange: (field: string, value: string) => void
  onSave: () => void
}

const SongEditor: React.FC<Props> = ({
  title,
  author,
  composer,
  tone,
  coverUrl,
  content,
  onChange,
  onSave
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs mb-1 block">Título</label>
          <input
            value={title}
            onChange={e => onChange('title', e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs mb-1 block">Autor</label>
          <input
            value={author}
            onChange={e => onChange('author', e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs mb-1 block">Compositor</label>
          <input
            value={composer}
            onChange={e => onChange('composer', e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs mb-1 block">Tono</label>
          <input
            value={tone}
            onChange={e => onChange('tone', e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
            placeholder="Ej: D, E, B, etc."
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs mb-1 block">Portada (URL opcional)</label>
          <input
            value={coverUrl}
            onChange={e => onChange('coverUrl', e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
            placeholder="https://... (imagen para miniatura en la biblioteca)"
          />
        </div>
      </div>

      <div>
        <label className="text-xs mb-1 block">
          Letra y acordes (acordes arriba, texto abajo)
        </label>
        <textarea
          value={content}
          onChange={e => onChange('content', e.target.value)}
          className="w-full min-h-[260px] rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm font-mono whitespace-pre"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Guardar canción
        </button>
      </div>
    </div>
  )
}

export default SongEditor
