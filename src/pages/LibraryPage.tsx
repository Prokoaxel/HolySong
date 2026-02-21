import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { cacheSongList, readCachedSongList } from '../lib/offlineSongs'
import type { Song } from '../types'
import ArtistAvatar from '../components/ui/ArtistAvatar'
import { useAuth } from '../hooks/useAuth'

type SongListItem = Song & {
  versionCount?: number
}

type VersionOption = {
  id: string
  label: string
}

const OWNER_EMAIL = 'axelproko2016@gmail.com'

const LibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [songs, setSongs] = useState<SongListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [menuSong, setMenuSong] = useState<SongListItem | null>(null)
  const [processingMenuAction, setProcessingMenuAction] = useState(false)
  const [versionDeleteModalOpen, setVersionDeleteModalOpen] = useState(false)
  const [versionEditModalOpen, setVersionEditModalOpen] = useState(false)
  const [versionOptions, setVersionOptions] = useState<VersionOption[]>([])

  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,author,tone,owner_id')
        .order('title', { ascending: true })

      if (!error && data) {
        const loaded = data as SongListItem[]
        const ids = loaded.map(song => song.id).filter(Boolean)

        const versionCountMap: Record<string, number> = {}
        if (ids.length > 0) {
          const { data: versionsData, error: versionsError } = await supabase
            .from('song_versions')
            .select('song_id')
            .in('song_id', ids)

          if (!versionsError && versionsData) {
            for (const row of versionsData as Array<{ song_id: string }>) {
              const songId = row.song_id
              versionCountMap[songId] = (versionCountMap[songId] || 0) + 1
            }
          } else if (versionsError) {
            console.warn('No se pudo cargar el conteo de versiones:', versionsError.message)
          }
        }

        const withVersionCount = loaded.map(song => ({
          ...song,
          versionCount: 1 + (versionCountMap[song.id] || 0),
        }))
        setSongs(withVersionCount)
        cacheSongList(withVersionCount)
      } else if (error) {
        console.error(error)
        const cached = readCachedSongList()
        if (cached.length > 0) {
          setSongs((cached as SongListItem[]).map(song => ({
            ...song,
            versionCount: (song as SongListItem).versionCount || 1,
          })))
          alert('Sin conexion: mostrando canciones guardadas localmente.')
        } else {
          alert('Error cargando biblioteca: ' + error.message)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const normalizedSearch = search.toLowerCase().trim()
  const filtered = songs.filter(s => {
    if (!normalizedSearch) return true
    const title = (s.title || '').toLowerCase()
    const author = (s.author || '').toLowerCase()
    return title.includes(normalizedSearch) || author.includes(normalizedSearch)
  })

  const openSong = (id: string) => {
    navigate(`/app/song/${id}`)
  }

  const isCreatorAccount = () => (user?.email || '').toLowerCase() === OWNER_EMAIL

  const requestSecurityCode = (actionLabel: string) => {
    const code = window.prompt(`Ingresa el codigo de seguridad para ${actionLabel}:`)
    if (code !== '030103') {
      alert('Codigo incorrecto. Accion cancelada.')
      return false
    }
    return true
  }

  const startLongPress = (song: SongListItem) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setMenuSong(song)
    }, 3000)
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleItemClick = (songId: string) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    openSong(songId)
  }

  const handleEditSong = () => {
    if (!menuSong) return
    if (!requestSecurityCode('editar la cancion')) return

    if ((menuSong.versionCount || 1) <= 1) {
      setMenuSong(null)
      navigate(`/app/import?songId=${menuSong.id}`)
      return
    }

    const openEditVersionSelector = async () => {
      try {
        setProcessingMenuAction(true)
        const { data, error } = await supabase
          .from('song_versions')
          .select('id,version_label')
          .eq('song_id', menuSong.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        const options = (data || []).map((v: any) => ({
          id: String(v.id),
          label: String(v.version_label || 'Version'),
        }))
        setVersionOptions(options)
        setVersionEditModalOpen(true)
      } catch (err: any) {
        console.error(err)
        alert('No se pudieron cargar las versiones para editar: ' + (err?.message || ''))
      } finally {
        setProcessingMenuAction(false)
      }
    }

    void openEditVersionSelector()
  }

  const handleEditBaseSong = () => {
    if (!menuSong) return
    setVersionEditModalOpen(false)
    setMenuSong(null)
    navigate(`/app/import?songId=${menuSong.id}`)
  }

  const handleEditVersion = (versionId: string) => {
    setVersionEditModalOpen(false)
    setMenuSong(null)
    navigate(`/app/import?versionId=${versionId}`)
  }

  const handleCreateVersion = async () => {
    if (!menuSong) return
    if (!requestSecurityCode('crear una nueva version')) return

    try {
      setProcessingMenuAction(true)

      const { data: baseSong, error: baseError } = await supabase
        .from('songs')
        .select('id,tone,content')
        .eq('id', menuSong.id)
        .maybeSingle()

      if (baseError || !baseSong) {
        throw baseError || new Error('No se pudo cargar la cancion base.')
      }

      const { data: existingVersions, error: versionsError } = await supabase
        .from('song_versions')
        .select('version_label')
        .eq('song_id', menuSong.id)

      if (versionsError) throw versionsError

      const usedNumbers = (existingVersions || [])
        .map((v: any) => {
          const m = /^Version\s+(\d+)$/i.exec(v.version_label || '')
          return m ? parseInt(m[1], 10) : null
        })
        .filter((n: number | null): n is number => typeof n === 'number')
      const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1

      const { error: insertError } = await supabase
        .from('song_versions')
        .insert({
          song_id: menuSong.id,
          version_label: `Version ${nextNumber}`,
          tone: baseSong.tone || null,
          content: baseSong.content || '',
        })

      if (insertError) throw insertError

      setSongs(prev => prev.map(song =>
        song.id === menuSong.id
          ? { ...song, versionCount: (song.versionCount || 1) + 1 }
          : song,
      ))

      setMenuSong(null)
      alert(`Version ${nextNumber} creada correctamente.`)
    } catch (err: any) {
      console.error(err)
      alert('No se pudo crear la nueva version: ' + (err?.message || ''))
    } finally {
      setProcessingMenuAction(false)
    }
  }

  const handleDeleteSong = async () => {
    if (!menuSong) return
    if (!requestSecurityCode('eliminar la cancion')) return

    if ((menuSong.versionCount || 1) > 1) {
      try {
        setProcessingMenuAction(true)
        const { data, error } = await supabase
          .from('song_versions')
          .select('id,version_label')
          .eq('song_id', menuSong.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        const options = (data || []).map((v: any) => ({
          id: String(v.id),
          label: String(v.version_label || 'Version'),
        }))
        setVersionOptions(options)
        setVersionDeleteModalOpen(true)
      } catch (err: any) {
        console.error(err)
        alert('No se pudieron cargar las versiones: ' + (err?.message || ''))
      } finally {
        setProcessingMenuAction(false)
      }
      return
    }

    const ok = window.confirm(`Se eliminara "${menuSong.title}". Continuar?`)
    if (!ok) return

    try {
      setProcessingMenuAction(true)

      await supabase.from('song_versions').delete().eq('song_id', menuSong.id)
      await supabase.from('folder_songs').delete().eq('song_id', menuSong.id)

      const { error: deleteSongError } = await supabase
        .from('songs')
        .delete()
        .eq('id', menuSong.id)

      if (deleteSongError) throw deleteSongError

      setSongs(prev => prev.filter(s => s.id !== menuSong.id))
      setMenuSong(null)
      alert('Cancion eliminada correctamente.')
    } catch (err: any) {
      console.error(err)
      alert('No se pudo eliminar la cancion: ' + (err?.message || ''))
    } finally {
      setProcessingMenuAction(false)
    }
  }

  const handleDeleteSingleVersion = async (versionId: string, label: string) => {
    if (!menuSong) return
    const ok = window.confirm(`Eliminar ${label} de "${menuSong.title}"?`)
    if (!ok) return

    try {
      setProcessingMenuAction(true)
      const { error } = await supabase
        .from('song_versions')
        .delete()
        .eq('id', versionId)
        .eq('song_id', menuSong.id)

      if (error) throw error

      setSongs(prev => prev.map(song =>
        song.id === menuSong.id
          ? { ...song, versionCount: Math.max(1, (song.versionCount || 1) - 1) }
          : song,
      ))
      setVersionOptions(prev => {
        const next = prev.filter(v => v.id !== versionId)
        if (next.length === 0) setVersionDeleteModalOpen(false)
        return next
      })
      alert(`Se elimino ${label}.`)
    } catch (err: any) {
      console.error(err)
      alert('No se pudo eliminar la version: ' + (err?.message || ''))
    } finally {
      setProcessingMenuAction(false)
    }
  }

  const handleDeleteAllVersions = async () => {
    if (!menuSong) return
    const ok = window.confirm(`Se eliminara "${menuSong.title}" con todas sus versiones. Continuar?`)
    if (!ok) return

    try {
      setProcessingMenuAction(true)
      await supabase.from('song_versions').delete().eq('song_id', menuSong.id)
      await supabase.from('folder_songs').delete().eq('song_id', menuSong.id)

      const { error: deleteSongError } = await supabase
        .from('songs')
        .delete()
        .eq('id', menuSong.id)

      if (deleteSongError) throw deleteSongError

      setSongs(prev => prev.filter(s => s.id !== menuSong.id))
      setVersionDeleteModalOpen(false)
      setVersionOptions([])
      setMenuSong(null)
      alert('Cancion y versiones eliminadas correctamente.')
    } catch (err: any) {
      console.error(err)
      alert('No se pudo eliminar todo: ' + (err?.message || ''))
    } finally {
      setProcessingMenuAction(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 fade-in">
      <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/40 p-4 md:p-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative">
          <label className="flex items-center gap-1.5 text-xs md:text-[11px] text-slate-300 mb-2 font-medium">
            <span>Buscar por titulo o artista</span>
          </label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Escribi titulo o artista..."
            className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-3 md:py-2 text-base md:text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 to-slate-900/80 p-2 md:p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 md:py-8">
            <p className="text-sm md:text-base text-slate-300 font-medium">Cargando canciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-sm md:text-base text-slate-300 font-medium">No se encontraron canciones</p>
            <p className="text-xs md:text-sm text-slate-400">Intenta con otro termino</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800/90 overflow-hidden bg-slate-950/35">
            {filtered.map((song, idx) => (
              <button
                key={song.id}
                onClick={() => handleItemClick(song.id)}
                onTouchStart={() => startLongPress(song)}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onMouseDown={() => startLongPress(song)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onContextMenu={e => e.preventDefault()}
                style={{
                  animationDelay: `${idx * 30}ms`,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                className="w-full select-none text-left px-3 md:px-4 py-2.5 md:py-2.5 min-h-[48px] transition-colors flex items-center gap-2.5 md:gap-3 animate-[fadeIn_300ms_ease] bg-slate-900/35 hover:bg-slate-800/65 border-b border-slate-800/70 last:border-b-0"
              >
                <ArtistAvatar author={song.author} sizeClassName="w-8 h-8" />

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] md:text-sm font-semibold text-slate-100 truncate">{song.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    {song.author && (
                      <span className="truncate max-w-[160px] md:max-w-none">
                        {song.author}
                      </span>
                    )}
                    {song.tone && (
                      <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-400/30 text-orange-200 font-semibold">
                        {song.tone}
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-400/35 text-purple-200 text-[10px] md:text-[11px] font-semibold whitespace-nowrap">
                  {song.versionCount || 1} {(song.versionCount || 1) === 1 ? 'version' : 'versiones'}
                </span>

                <span className="text-slate-500 text-sm leading-none">{'>'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {menuSong && createPortal(
        <div className="fixed inset-0 z-[130]">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => !processingMenuAction && setMenuSong(null)}
            aria-label="Cerrar menu"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-100 truncate">{menuSong.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">Menu de cancion (presion larga 3 segundos)</p>
              <p className="text-[10px] text-slate-500 mt-1">Duenio principal de la app: {OWNER_EMAIL}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleEditSong}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {(menuSong.versionCount || 1) > 1 ? 'Editar (elegir version)' : 'Editar letra'}
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2.5 text-sm text-purple-100 hover:bg-purple-500/20 disabled:opacity-60"
              >
                Crear nueva version
              </button>
              <button
                onClick={handleDeleteSong}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-100 hover:bg-red-500/20 disabled:opacity-60"
              >
                {(menuSong.versionCount || 1) > 1 ? 'Eliminar versiones' : 'Eliminar cancion'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {menuSong && versionDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[140]">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => !processingMenuAction && setVersionDeleteModalOpen(false)}
            aria-label="Cerrar selector de versiones"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-100 truncate">{menuSong.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">Elegi una version para eliminar, o elimina todas.</p>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {versionOptions.length === 0 ? (
                <p className="text-[12px] text-slate-400">No se encontraron versiones extra para esta cancion.</p>
              ) : (
                versionOptions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleDeleteSingleVersion(v.id, v.label)}
                    disabled={processingMenuAction}
                    className="w-full rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/20 disabled:opacity-60 text-left"
                  >
                    Eliminar {v.label}
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={handleDeleteAllVersions}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-100 hover:bg-red-500/20 disabled:opacity-60"
              >
                Eliminar todas las versiones
              </button>
              <button
                onClick={() => setVersionDeleteModalOpen(false)}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {menuSong && versionEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[145]">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => !processingMenuAction && setVersionEditModalOpen(false)}
            aria-label="Cerrar selector de versiones para editar"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-100 truncate">{menuSong.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">Elegi que version queres editar.</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              <button
                onClick={handleEditBaseSong}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-teal-500/35 bg-teal-500/10 px-3 py-2 text-sm text-teal-100 hover:bg-teal-500/20 disabled:opacity-60 text-left"
              >
                Editar cancion base
              </button>
              {versionOptions.length === 0 ? (
                <p className="text-[12px] text-slate-400">No se encontraron versiones extra para esta cancion.</p>
              ) : (
                versionOptions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleEditVersion(v.id)}
                    disabled={processingMenuAction}
                    className="w-full rounded-lg border border-purple-500/35 bg-purple-500/10 px-3 py-2 text-sm text-purple-100 hover:bg-purple-500/20 disabled:opacity-60 text-left"
                  >
                    Editar {v.label}
                  </button>
                ))
              )}
            </div>

            <div className="mt-3">
              <button
                onClick={() => setVersionEditModalOpen(false)}
                disabled={processingMenuAction}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default LibraryPage
