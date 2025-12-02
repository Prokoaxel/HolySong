import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Song, FolderSong } from '../types'

const FolderDetailPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [folderName, setFolderName] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [folderSongs, setFolderSongs] = useState<FolderSong[]>([]) // Para guardar transposiciones
  const [songSearch, setSongSearch] = useState('')
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [libraryQuery, setLibraryQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [editingTranspose, setEditingTranspose] = useState<string | null>(null)
  const [tempTranspose, setTempTranspose] = useState<number>(0)
  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return

      const f = await supabase.from('folders').select('name').eq('id', id).single()
      if (f.data) setFolderName(f.data.name)

      const res = await supabase
        .from('folder_songs')
        .select('song_id, custom_transpose, songs(title,id,tone)')
        .eq('folder_id', id)

      if (res.data) {
        const folderSongsList = res.data as FolderSong[]
        setFolderSongs(folderSongsList)
        const list = folderSongsList.map((r: any) => r.songs as Song)
        setSongs(list)
        setCurrentIndex(list.length ? 0 : null)
      }

      const all = await supabase.from('songs').select('id,title').order('title', {
        ascending: true,
      })
      if (all.data) setAllSongs(all.data as Song[])
    }
    load()
  }, [id, user])

  // Swipe handlers (derecha = siguiente, izquierda = anterior)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    const distance = touchEnd - touchStart
    if (distance > minSwipeDistance) {
      // swipe derecha -> siguiente
      goNextInFolder()
    } else if (distance < -minSwipeDistance) {
      // swipe izquierda -> anterior
      goPrevInFolder()
    }
  }

  // add a song by id to the current folder
  const addToFolder = async (songId: string) => {
    if (!songId || !id) return
    if (songs.some(s => s.id === songId)) {
      alert('⚠️ La canción ya está en la carpeta.')
      return
    }

    if (!user) {
      alert('❌ Debes iniciar sesión')
      return
    }

    // Insertar en folder_songs con custom_transpose por defecto en 0
    const { error } = await supabase
      .from('folder_songs')
      .insert({
        folder_id: id,
        song_id: songId,
        custom_transpose: 0
      })

    if (error) {
      console.error('Error agregando canción:', error)
      alert('❌ Error agregando canción: ' + error.message)
      return
    }

    // Agregar a la lista local
    const added = allSongs.find(s => s.id === songId)
    if (added) {
      setSongs(prev => [...prev, added])
      setFolderSongs(prev => [...prev, {
        folder_id: id,
        song_id: songId,
        custom_transpose: 0,
        songs: added
      }])
    }
    alert('✅ Canción agregada a la carpeta')
  }

  // Actualizar transposición personalizada de una canción en la carpeta
  const updateCustomTranspose = async (songId: string, transpose: number) => {
    if (!id) return
    
    const { error } = await supabase
      .from('folder_songs')
      .update({ custom_transpose: transpose })
      .eq('folder_id', id)
      .eq('song_id', songId)

    if (error) {
      console.error('Error actualizando transposición:', error)
      alert('❌ Error guardando transposición')
    } else {
      // Actualizar el estado local
      setFolderSongs(prev => 
        prev.map(fs => 
          fs.song_id === songId 
            ? { ...fs, custom_transpose: transpose }
            : fs
        )
      )
      setEditingTranspose(null)
    }
  }

  const removeFromFolder = async (songId: string) => {
    if (!id) return
    const ok = window.confirm('¿Sacar esta canción de la carpeta?')
    if (!ok) return
    
    if (!user) {
      alert('❌ Debes iniciar sesión')
      return
    }

    // Eliminar de folder_songs
    const { error } = await supabase
      .from('folder_songs')
      .delete()
      .eq('folder_id', id)
      .eq('song_id', songId)

    if (error) {
      console.error('Error removiendo canción:', error)
      alert('❌ Error removiendo la canción: ' + error.message)
      return
    }

    const origIndex = songs.findIndex(s => s.id === songId)
    const newSongs = songs.filter(s => s.id !== songId)
    setSongs(newSongs)
    setFolderSongs(prev => prev.filter(fs => fs.song_id !== songId))
    setCurrentIndex(prev => {
      if (!newSongs.length) return null
      if (prev === null) return null
      if (origIndex === -1) return prev
      if (origIndex < prev) return prev - 1
      if (origIndex === prev) return Math.max(0, prev - 1)
      return prev
    })
    alert('✅ Canción removida de la carpeta')
  }

  const goPrevInFolder = () => {
    if (currentIndex === null || !songs.length) return
    if (currentIndex <= 0) return
    setCurrentIndex(currentIndex - 1)
    const s = songs[currentIndex - 1]
    navigate(`/app/song/${s.id}`)
  }

  const goNextInFolder = () => {
    if (currentIndex === null || !songs.length) return
    if (currentIndex >= songs.length - 1) return
    setCurrentIndex(currentIndex + 1)
    const s = songs[currentIndex + 1]
    navigate(`/app/song/${s.id}`)
  }

  const openCurrentSong = () => {
    if (currentIndex === null) return
    const s = songs[currentIndex]
    if (!s) return
    navigate(`/app/song/${s.id}`)
  }

  return (
    <div
      className="space-y-3 sm:space-y-6 max-w-5xl mx-auto py-2 sm:py-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header mejorado */}
      <div className="relative rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-400/40 sm:border-2 p-3 sm:p-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-lg animate-pulse" />
            <span className="relative text-2xl sm:text-4xl">📂</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">{folderName}</h1>
            <p className="text-[10px] sm:text-xs text-slate-300 flex items-center gap-1 mt-0.5 sm:mt-1">
              <span>🎵</span>
              {songs.length} canción{songs.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Agregar canción a la carpeta (buscar en biblioteca) */}
      <div className="rounded-lg sm:rounded-xl border border-slate-700 sm:border-2 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-3 sm:p-5 space-y-3 sm:space-y-4 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">📚</span>
          <h2 className="font-bold text-xs sm:text-sm text-slate-200">Agregar desde biblioteca</h2>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <input
            value={libraryQuery}
            onChange={e => setLibraryQuery(e.target.value)}
            placeholder="Buscar canción..."
            className="rounded-lg bg-slate-900/80 border border-slate-700 sm:border-2 focus:border-purple-500/50 px-3 sm:px-4 py-2 text-xs sm:text-sm flex-1 outline-none transition-all"
          />
        </div>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-800 sm:border-2 bg-slate-950/80">
          {allSongs
            .filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase()))
            .slice(0, 50)
            .map((a, idx) => (
              <div
                key={a.id}
                style={{ animationDelay: `${idx * 20}ms` }}
                className="px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 border-b border-slate-900/40 last:border-b-0 hover:bg-slate-900/50 transition-all animate-[fadeIn_300ms_ease]"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-base sm:text-lg flex-shrink-0">🎵</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm text-slate-100 truncate">{a.title}</div>
                    {a.author && <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-0.5 sm:gap-1 mt-0.5 truncate"><span>👤</span><span className="truncate">{a.author}</span></div>}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/app/song/${a.id}`)}
                    className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all hover:scale-105 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-0.5 sm:gap-1"
                  >
                    <span>👁️</span>
                    <span className="hidden sm:inline">Abrir</span>
                  </button>
                  <button
                    onClick={() => addToFolder(a.id)}
                    disabled={songs.some(x => x.id === a.id)}
                    className={
                      'rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all hover:scale-105 flex items-center gap-0.5 sm:gap-1 ' +
                      (songs.some(x => x.id === a.id)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 shadow-lg')
                    }
                  >
                    <span>{songs.some(x => x.id === a.id) ? '✓' : '➕'}</span>
                    <span className="hidden sm:inline">{songs.some(x => x.id === a.id) ? 'Agregada' : 'Agregar'}</span>
                  </button>
                </div>
              </div>
            ))}
          {libraryQuery && allSongs.filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase())).length === 0 && (
            <div className="px-4 py-8 text-center">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs text-slate-400">No se encontraron canciones con ese término</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de canciones de la carpeta */}
      <div className="rounded-lg sm:rounded-xl border border-slate-700 sm:border-2 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-2 sm:p-4 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🎶</span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-200">Canciones</h2>
          </div>
          {/* Buscador compacto dentro del recuadro */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial sm:max-w-xs">
            <label className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
              <span>🔍</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700 focus:border-purple-500/50 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs outline-none transition-all"
              value={songSearch}
              onChange={e => setSongSearch(e.target.value)}
              placeholder="Buscar..."
            />
          </div>
        </div>
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-5xl">📂</span>
            <p className="text-sm text-slate-300 font-medium">
              Esta carpeta está vacía
            </p>
            <p className="text-xs text-slate-400">
              Agregá canciones desde la biblioteca de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs
              .filter(s => s.title.toLowerCase().includes(songSearch.toLowerCase()))
              .map((s, idx) => {
                const origIdx = songs.findIndex(x => x.id === s.id)
                const isActive = origIdx === currentIndex
                const folderSong = folderSongs.find(fs => fs.song_id === s.id)
                const customTranspose = folderSong?.custom_transpose || 0
                const isEditing = editingTranspose === s.id
                
                // Calcular tono transpuesto
                const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
                const originalTone = s.tone || 'C'
                const transposeNote = (note: string, steps: number) => {
                  const idx = NOTES.indexOf(note)
                  if (idx === -1) return note
                  return NOTES[(idx + steps + 12) % 12]
                }
                const transposedTone = customTranspose !== 0 ? transposeNote(originalTone, customTranspose) : null
                
                return (
              <div
                key={s.id}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={
                  'rounded-lg px-2 sm:px-4 py-2 sm:py-3 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 animate-[fadeIn_300ms_ease] cursor-pointer ' +
                  (isActive
                    ? 'bg-gradient-to-r from-teal-900/40 to-teal-800/40 ring-1 sm:ring-2 ring-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-900/60 border border-slate-700 hover:border-purple-500/50')
                }
                onClick={() => {
                  setCurrentIndex(origIdx === -1 ? null : origIdx)
                  navigate(`/app/song/${s.id}?folderId=${id}`)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentIndex(origIdx === -1 ? null : origIdx)
                    navigate(`/app/song/${s.id}?folderId=${id}`)
                  }
                }}
              >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg transition-all flex-shrink-0 ' +
                      (isActive
                        ? 'bg-gradient-to-br from-teal-500/30 to-teal-600/20 border-2 border-teal-400'
                        : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-slate-700')
                    }>
                      {isActive ? '▶️' : '🎵'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate">{s.title}</p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        {isActive && (
                          <span className="text-[10px] sm:text-xs text-teal-300 font-medium">📍 Actual</span>
                        )}
                        {s.tone && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-semibold border border-slate-600">
                            🎼 {originalTone}
                            {transposedTone && (
                              <span className="text-purple-300"> → {transposedTone}</span>
                            )}
                          </span>
                        )}
                        {customTranspose !== 0 && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                            {customTranspose > 0 ? '+' : ''}{customTranspose}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {/* Control de transposición */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-500/50 sm:border-2 shadow-lg shadow-purple-500/20 animate-[fadeIn_200ms_ease] w-full sm:w-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); setTempTranspose(prev => prev - 1) }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs sm:text-sm font-bold transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center"
                        >
                          <span className="text-white">−</span>
                        </button>
                        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wide hidden sm:block">Semitonos</span>
                          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {tempTranspose > 0 ? '+' : ''}{tempTranspose}
                          </span>
                          {s.tone && (
                            <span className="text-[9px] sm:text-[10px] text-teal-400 font-semibold">
                              {originalTone} → {transposeNote(s.tone, tempTranspose)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTempTranspose(prev => prev + 1) }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-xs sm:text-sm font-bold transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center"
                        >
                          <span className="text-white">+</span>
                        </button>
                        <div className="w-px h-6 sm:h-8 bg-slate-700 mx-0.5 sm:mx-1"></div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTempTranspose(0) }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] sm:text-xs font-bold transition-all hover:scale-110 active:scale-95"
                          title="Resetear a original"
                        >
                          0
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCustomTranspose(s.id, tempTranspose)
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-xs sm:text-sm transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center"
                        >
                          <span className="text-white">✓</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTranspose(s.id)
                          setTempTranspose(customTranspose)
                        }}
                        className="rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold transition-all hover:scale-110 active:scale-95 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border border-purple-400/60 sm:border-2 shadow-lg shadow-purple-500/30 flex items-center gap-1 sm:gap-1.5"
                        title="Ajustar tono para esta carpeta"
                      >
                        <span className="text-xs sm:text-sm">🎸</span>
                        <span>{customTranspose !== 0 ? `${customTranspose > 0 ? '+' : ''}${customTranspose}` : 'Tono'}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(origIdx === -1 ? null : origIdx)
                        navigate(`/app/song/${s.id}?folderId=${id}`)
                      }}
                      className="rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-bold transition-all hover:scale-110 active:scale-95 bg-slate-800 hover:bg-slate-700 border border-slate-700 sm:border-2 shadow-lg flex items-center gap-1 sm:gap-1.5"
                    >
                      <span>👁️</span>
                      <span className="hidden sm:inline">Abrir</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromFolder(s.id) }}
                      className="rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-bold transition-all hover:scale-110 active:scale-95 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-400/60 sm:border-2 shadow-lg flex items-center gap-1 sm:gap-1.5"
                    >
                      <span>🗑️</span>
                      <span className="hidden sm:inline">Sacar</span>
                    </button>
                  </div>
              </div>
              )
              })}
          </div>
        )}
      </div>

      {/* Flechas fijas tipo overlay (aparecen si hay canciones) */}
      {songs.length > 1 && currentIndex !== null && createPortal(
        <div className="fixed inset-0 z-[120] pointer-events-none">
          <button
            onClick={goPrevInFolder}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-24 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 flex items-center justify-center opacity-20 hover:opacity-100 transition-all pointer-events-auto"
            aria-label="Anterior"
          >
            <span className="text-slate-300 text-sm">←</span>
          </button>
          <button
            onClick={goNextInFolder}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-24 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 flex items-center justify-center opacity-20 hover:opacity-100 transition-all pointer-events-auto"
            aria-label="Siguiente"
          >
            <span className="text-slate-300 text-sm">→</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export default FolderDetailPage
