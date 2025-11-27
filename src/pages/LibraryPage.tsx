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
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 fade-in">
      {/* Cabecera mejorada con gradiente */}
      <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/40 p-4 md:p-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-lg animate-pulse" />
              <span className="relative text-3xl md:text-4xl">📚</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-1">
                Biblioteca global
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                Todas las canciones cargadas en HolySong.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-stretch md:items-end w-full md:w-auto">
            <div className="w-full md:max-w-xs">
              <label className="flex items-center gap-1.5 text-xs md:text-[11px] text-slate-300 mb-2 font-medium">
                <span>🔍</span>
                Buscar por título
              </label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Escribí el nombre..."
                className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-3 md:py-2 text-base md:text-sm outline-none transition-all"
              />
            </div>

            {filtered.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={
                  'self-stretch md:self-end rounded-lg px-4 py-3 md:py-2 text-sm md:text-xs font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 ' +
                  (selectionMode
                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg')
                }
              >
                {selectionMode ? (
                  <>
                    <span>✖️</span>
                    Cancelar
                  </>
                ) : (
                  <>
                    <span>☑️</span>
                    Seleccionar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de acciones selección - Arriba */}
      {selectionMode && (
        <div className="animate-[fadeIn_300ms_ease]">
          <div className="rounded-xl border-2 border-purple-500/50 bg-gradient-to-r from-slate-900 via-purple-900/30 to-slate-900 px-4 md:px-5 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 md:justify-between shadow-lg shadow-purple-500/30">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="text-2xl">{selectedIds.length > 0 ? '✅' : '☑️'}</span>
              <span className="text-sm md:text-base font-semibold text-slate-200">
                {selectedIds.length === 0
                  ? 'Seleccioná canciones'
                  : `${selectedIds.length} seleccionada${selectedIds.length > 1 ? 's' : ''}`}
              </span>
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={working || selectedIds.length === 0}
              className={
                'px-5 py-3 md:py-2.5 rounded-lg text-sm md:text-sm font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 ' +
                (selectedIds.length > 0 && !working
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50')
              }
            >
              {working ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista mejorada con animaciones */}
      <div className="rounded-xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-3 md:p-4 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 md:py-8">
            <span className="text-2xl md:text-3xl animate-spin">⚙️</span>
            <p className="text-sm md:text-base text-slate-300 font-medium">
              Cargando canciones...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-5xl">🔍</span>
            <p className="text-sm md:text-base text-slate-300 font-medium">
              No se encontraron canciones
            </p>
            <p className="text-xs md:text-sm text-slate-400">
              Intentá con otro término
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((song, idx) => (
              <button
                key={song.id}
                onClick={() => openSong(song.id)}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={
                  'w-full text-left rounded-lg px-3 md:px-4 py-3 md:py-3 min-h-[60px] transition-all hover:scale-[1.01] flex items-center gap-3 md:gap-4 animate-[fadeIn_300ms_ease] ' +
                  (selectionMode && isSelected(song.id)
                    ? 'bg-gradient-to-r from-teal-900/40 to-teal-800/40 ring-2 ring-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/50')
                }
              >
                <div className="relative flex-shrink-0">
                  <div className={
                    'w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all ' +
                    (isSelected(song.id) 
                      ? 'bg-gradient-to-br from-teal-500/30 to-teal-600/20 border-2 border-teal-400' 
                      : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-slate-700')
                  }>
                    🎵
                  </div>
                  {selectionMode && isSelected(song.id) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[10px] animate-bounce">
                      ✓
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-semibold text-slate-100 truncate">
                    {song.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-[11px] text-slate-400 mt-1 flex-wrap">
                    {song.author && (
                      <span className="flex items-center gap-1 truncate max-w-[150px] md:max-w-none">
                        <span>👤</span>
                        <span className="truncate">{song.author}</span>
                      </span>
                    )}
                    {song.tone && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-200">
                        <span>🎹</span>
                        {song.tone}
                      </span>
                    )}
                  </div>
                </div>

                {selectionMode && !isSelected(song.id) && (
                  <div className="w-6 h-6 rounded-md border-2 border-slate-600 flex items-center justify-center bg-slate-900/50 transition-all hover:border-purple-400 flex-shrink-0">
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default LibraryPage
