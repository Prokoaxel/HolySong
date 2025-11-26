import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

import type { Song } from '../types'

const LibraryPage: React.FC = () => {
  const navigate = useNavigate()

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // NUEVO: selección y borrado
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,author,tone')
        .order('title', { ascending: true }) // GLOBAL

      if (!error && data) {
        setSongs(data as Song[])
      } else if (error) {
        console.error(error)
        alert('Error cargando biblioteca: ' + error.message)
      }

      setLoading(false)
    }

    load()
  }, [])

  const filtered = songs.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()),
  )

  const toggleSelectionMode = () => {
    setSelectionMode(prev => {
      const next = !prev
      if (!next) setSelectedIds([])
      return next
    })
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id],
    )
  }

  const openSong = (id: string) => {
    if (selectionMode) {
      toggleSelection(id)
    } else {
      navigate(`/app/song/${id}`)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    const ok = window.confirm(
      `¿Eliminar ${selectedIds.length} canción(es) de la biblioteca global?`,
    )
    if (!ok) return

    try {
      setWorking(true)
      const { error } = await supabase
        .from('songs')
        .delete()
        .in('id', selectedIds)

      if (error) throw error

      setSongs(prev =>
        prev.filter(s => !selectedIds.includes(s.id)),
      )
      setSelectedIds([])
      setSelectionMode(false)
    } catch (err: any) {
      console.error(err)
      alert('Error eliminando canciones: ' + err.message)
    } finally {
      setWorking(false)
    }
  }

  const isSelected = (id: string) => selectedIds.includes(id)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabecera + selección */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold mb-1">
            Biblioteca global
          </h1>
          <p className="text-xs text-slate-400">
            Todas las canciones cargadas en HolySong. Tus carpetas son
            privadas, pero las canciones son compartidas.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end w-full md:w-auto">
          <div className="max-w-xs w-full">
            <label className="block text-[11px] text-slate-400 mb-1">
              Buscar por título
            </label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Escribí el nombre..."
              className="w-full rounded-2xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs outline-none focus:border-teal-400"
            />
          </div>

          {filtered.length > 0 && (
            <button
              onClick={toggleSelectionMode}
              className="self-end text-[11px] rounded-full border border-slate-700 px-3 py-1 bg-slate-900 hover:border-teal-400"
            >
              {selectionMode
                ? 'Cancelar selección'
                : 'Seleccionar canciones'}
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 md:p-4">
        {loading ? (
          <p className="text-xs text-slate-400">
            Cargando canciones...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400">
            No se encontraron canciones con ese filtro.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(song => (
              <button
                key={song.id}
                onClick={() => openSong(song.id)}
                className={
                  'w-full text-left px-2 py-2 md:px-3 md:py-2 hover:bg-slate-900/70 flex items-center gap-3 ' +
                  (selectionMode && isSelected(song.id)
                    ? 'bg-slate-900 ring-1 ring-teal-400'
                    : '')
                }
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-xs">
                  🎼
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {song.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {song.author ? `${song.author} • ` : ''}
                    {song.tone ? `Tono: ${song.tone}` : ''}
                  </p>
                </div>

                {selectionMode && (
                  <div className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center text-[10px] bg-slate-900">
                    {isSelected(song.id) && '✓'}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Barra de acciones selección */}
      {selectionMode && (
        <div className="sticky bottom-0 mt-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">
              {selectedIds.length === 0
                ? 'Seleccioná una o varias canciones.'
                : `${selectedIds.length} canción(es) seleccionada(s).`}
            </span>
            <button
              onClick={handleDeleteSelected}
              disabled={
                working || selectedIds.length === 0
              }
              className={
                'px-3 py-1 rounded-full text-[11px] ' +
                (selectedIds.length > 0 && !working
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed')
              }
            >
              Eliminar seleccionadas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LibraryPage
