import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import SongViewer from '../components/songs/SongViewer'
import type { LiveSession, Song, Folder, Role } from '../types'


const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

const LiveSessionPage: React.FC = () => {
  const { user } = useAuth()
  const [role, setRole] = useState<Role>('none')
  const [session, setSession] = useState<LiveSession | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const [songs, setSongs] = useState<Song[]>([])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)

  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')

  const channelRef = useRef<any>(null)

  const isAdmin = role === 'admin'

  // Cargar carpetas privadas del usuario + canciones globales
  useEffect(() => {
    const load = async () => {
      // carpetas PRIVADAS, por usuario
      if (user) {
        const fs = await supabase
          .from('folders')
          .select('id,name')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
        if (!fs.error && fs.data) setFolders(fs.data as Folder[])
      }

      await loadSongsForFolder()
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadSongsForFolder = async (folderId?: string) => {
    if (!folderId) {
      // TODAS LAS CANCIONES GLOBALES
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,tone,content')
        .order('title', { ascending: true })
      if (!error && data) setSongs(data as Song[])
      return
    }

    // canciones ligadas a una carpeta privada
    const { data, error } = await supabase
      .from('folder_songs')
      .select('songs(id,title,tone,content)')
      .eq('folder_id', folderId)

    if (!error && data) {
      setSongs((data as any[]).map(r => r.songs as Song))
    }
  }

  const subscribeToSession = (sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('live_session_' + sessionId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        payload => {
          const newRow = payload.new as LiveSession
          setSession(prev => ({ ...(prev || newRow), ...newRow }))
        },
      )
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    const fetchSong = async () => {
      if (!session?.current_song) {
        setCurrentSong(null)
        return
      }
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,tone,content')
        .eq('id', session.current_song)
        .single()

      if (!error && data) {
        setCurrentSong(data as Song)
      }
    }
    fetchSong()
  }, [session?.current_song])

  const updateSession = async (patch: Partial<LiveSession>) => {
    if (!session) return
    const { data, error } = await supabase
      .from('live_sessions')
      .update(patch)
      .eq('id', session.id)
      .select('id,code,owner_id,current_song,transpose,capo')
      .single()

    if (!error && data) {
      setSession(data as LiveSession)
    } else if (error) {
      console.error('Error actualizando sesión:', error)
    }
  }

  const createSession = async () => {
    if (!user) {
      alert('Necesitás estar logueado para crear una sala.')
      return
    }
    setLoading(true)
    const code = randomCode()

    const { data, error } = await supabase
      .from('live_sessions')
      .insert({ owner_id: user.id, code })
      .select('id,code,owner_id,current_song,transpose,capo')
      .single()

    setLoading(false)

    if (error || !data) {
      console.error(error)
      alert('Error creando sala: ' + (error?.message ?? ''))
      return
    }

    const sessionRow = data as LiveSession
    setSession(sessionRow)
    setRole('admin')
    subscribeToSession(sessionRow.id)
  }

  const joinSession = async () => {
    if (!joinCode.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('live_sessions')
      .select('id,code,owner_id,current_song,transpose,capo')
      .eq('code', joinCode.trim().toUpperCase())
      .single()

    setLoading(false)

    if (error || !data) {
      console.error(error)
      alert('No se encontró ninguna sala con ese código.')
      return
    }

    const sessionRow = data as LiveSession
    setSession(sessionRow)
    setRole('listener')
    subscribeToSession(sessionRow.id)
  }

  const leaveSession = () => {
    setRole('none')
    setSession(null)
    setCurrentSong(null)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  // Navegación rápida entre canciones en la sesión (Admin)
  const goToPrevSong = () => {
    if (!songs.length) return
    if (!currentSong) {
      const first = songs[0]
      updateSession({ current_song: first.id as any })
      return
    }
    const idx = songs.findIndex(s => s.id === currentSong.id)
    if (idx <= 0) return
    const prev = songs[idx - 1]
    updateSession({ current_song: prev.id as any })
  }

  const goToNextSong = () => {
    if (!songs.length) return
    if (!currentSong) {
      const first = songs[0]
      updateSession({ current_song: first.id as any })
      return
    }
    const idx = songs.findIndex(s => s.id === currentSong.id)
    if (idx === -1 || idx >= songs.length - 1) return
    const next = songs[idx + 1]
    updateSession({ current_song: next.id as any })
  }

  // UI cuando no estás en sesión
  if (!session || role === 'none') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-semibold mb-1">Sesión en vivo</h1>
          <p className="text-xs text-slate-400">
            Lo que haga el administrador (cambiar tono, letra, canción) se reflejará en
            todos los oyentes conectados. Primero creá una sala o unite con un código.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold mb-1">Administrador</h2>
            <p className="text-xs text-slate-400 mb-2">
              Crea una sala en vivo, seleccioná canciones y controlá el tono para todos
              los oyentes.
            </p>
            <button
              onClick={createSession}
              disabled={loading}
              className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear nueva sala'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold mb-1">Oyente</h2>
            <p className="text-xs text-slate-400">
              Ingresá el código que te pasó el administrador para seguir la letra y el
              tono en vivo.
            </p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Código de la sala"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs mt-2"
            />
            <button
              onClick={joinSession}
              disabled={loading || !joinCode.trim()}
              className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
            >
              Unirse
            </button>
          </div>
        </div>
      </div>
    )
  }

  // UI dentro de la sesión
  return (
    <div className="space-y-6">
      {/* Header sesión */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-teal-300 mb-1">
            SESIÓN EN VIVO • CÓDIGO:{' '}
            <span className="font-semibold text-teal-100">{session.code}</span>
          </p>
          <h1 className="text-xl font-semibold">
            {isAdmin ? 'Panel del administrador' : 'Modo oyente'}
          </h1>
          <p className="text-xs text-slate-400">
            Compartí este código con tu equipo para que se conecten a esta sesión.
          </p>
        </div>

        <div className="text-right text-[11px] text-slate-400">
          <p>
            Rol:{' '}
            <span className="font-semibold text-teal-200">
              {isAdmin ? 'Administrador' : 'Oyente'}
            </span>
          </p>
          <button
            onClick={leaveSession}
            className="mt-2 rounded-full border border-slate-700 px-3 py-1 hover:border-red-500 hover:text-red-300"
          >
            Salir de la sala
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px,minmax(0,1fr)]">
        {/* Panel de control */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4 text-xs">
          <div>
            <p className="font-semibold mb-1">Canción actual</p>

            {isAdmin ? (
              <>
                {/* Carpeta */}
                <label className="block text-[11px] text-slate-400 mb-1">
                  Carpeta
                </label>
                <select
                  value={selectedFolderId}
                  onChange={e => {
                    const id = e.target.value
                    setSelectedFolderId(id)
                    loadSongsForFolder(id || undefined)
                  }}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs mb-3"
                >
                  <option value="">(Todas las canciones)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                {/* Canción */}
                <label className="block text-[11px] text-slate-400 mb-1">
                  Canción
                </label>
                <select
                  value={currentSong?.id || ''}
                  onChange={e => {
                    const songId = e.target.value || null
                    updateSession({ current_song: songId as any })
                  }}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                >
                  <option value="">(Ninguna)</option>
                  {songs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                {/* Botones anterior / siguiente */}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={goToPrevSong}
                    className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                  >
                    ← Anterior canción
                  </button>
                  <button
                    onClick={goToNextSong}
                    className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                  >
                    Siguiente canción →
                  </button>
                </div>

                {selectedFolderId && currentSong && (
                  <button
                    onClick={async () => {
                      const { data: sessionData } = await supabase.auth.getSession()
                      const token = sessionData?.session?.access_token
                      if (!token) return alert('Necesitás iniciar sesión')

                      const resp = await fetch(`/api/folders/${selectedFolderId}/songs`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ song_id: currentSong.id }),
                      })

                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}))
                        alert('Error agregando a carpeta: ' + (err.error || resp.statusText))
                      } else {
                        alert('Canción agregada a la carpeta')
                      }
                    }}
                    className="mt-2 w-full rounded bg-slate-800 py-1 text-[11px]"
                  >
                    Agregar canción seleccionada a esta carpeta
                  </button>
                )}

                <p className="text-[10px] text-slate-500 mt-2">
                  Elegí carpeta y canción; todos los oyentes verán la misma.
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-300">
                {currentSong
                  ? currentSong.title
                  : 'El administrador todavía no eligió una canción.'}
              </p>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <p className="font-semibold">Tono (transposición)</p>
            <p className="text-[11px] text-slate-400">
              Semitonos:{' '}
              <span className="font-semibold text-teal-200">
                {session.transpose}
              </span>
            </p>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateSession({ transpose: session.transpose - 1 })
                  }
                  className="flex-1 rounded bg-slate-800 py-1"
                >
                  - ½
                </button>
                <button
                  onClick={() =>
                    updateSession({ transpose: session.transpose + 1 })
                  }
                  className="flex-1 rounded bg-slate-800 py-1"
                >
                  + ½
                </button>
                <button
                  onClick={() => updateSession({ transpose: 0 })}
                  className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <p className="font-semibold">Capo</p>
            <p className="text-[11px] text-slate-400">
              Traste:{' '}
              <span className="font-semibold text-teal-200">
                {session.capo}
              </span>
            </p>
            {isAdmin && (
              <input
                type="range"
                min={0}
                max={7}
                value={session.capo}
                onChange={e =>
                  updateSession({ capo: Number(e.target.value) })
                }
                className="w-full"
              />
            )}
          </div>

          {!isAdmin && (
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900">
              Los cambios de tono y capo los controla el administrador.
            </p>
          )}
        </div>

        {/* Visor compartido */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          {currentSong ? (
            <SongViewer
              title={currentSong.title}
              tone={currentSong.tone || ''}
              content={currentSong.content || ''}
              externalTranspose={session.transpose}
              externalCapo={session.capo}
            />
          ) : (
            <p className="text-xs text-slate-400">
              Todavía no hay una canción seleccionada para esta sesión.
              {isAdmin && ' Elegí una desde el panel de la izquierda.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveSessionPage
