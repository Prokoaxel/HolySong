import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import SongViewer from '../components/songs/SongViewerFixed'
import type { LiveSession, Song, Folder, Role } from '../types'

type SongWithTranspose = Song & { transposeCustom?: number }


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
  const [copied, setCopied] = useState(false)

  const [songs, setSongs] = useState<SongWithTranspose[]>([])
  const [currentSong, setCurrentSong] = useState<SongWithTranspose | null>(null)

  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')

  // Estados para modal de agregar canción
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  
  // Estados para swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const channelRef = useRef<any>(null)
  const pollingIntervalRef = useRef<any>(null)

  const isAdmin = role === 'admin'

  // Constantes para swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && isAdmin) {
      // Swipe izquierda = siguiente
      goToNextSong()
    }
    if (isRightSwipe && isAdmin) {
      // Swipe derecha = anterior
      goToPrevSong()
    }
  }

  // Cargar todas las canciones para el buscador
  const loadAllSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('id,title,tone,content')
      .order('title', { ascending: true })
    if (!error && data) {
      setAllSongs(data as Song[])
      setFilteredSongs(data as Song[])
    }
  }

  // Filtrar canciones según búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(allSongs)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSongs(
        allSongs.filter(song => 
          song.title.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, allSongs])

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
      await loadAllSongs()
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
      .select('custom_transpose, songs(id,title,tone,content)')
      .eq('folder_id', folderId)

    if (!error && data) {
      setSongs((data as any[]).map(r => ({
        ...(r.songs as Song),
        transposeCustom: r.custom_transpose || 0
      })))
    }
  }

  const subscribeToSession = (sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    console.log('🔗 Creando suscripción para sesión:', sessionId)

    const channel = supabase
      .channel(`live_session_${sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: sessionId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        payload => {
          console.log('📡 Actualización en tiempo real recibida:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newRow = payload.new as LiveSession
            console.log('📝 Aplicando nuevo estado:', newRow)
            setSession(newRow)
          }
        },
      )
      .subscribe((status, err) => {
        console.log('🔌 Estado de suscripción:', status)
        if (err) {
          console.error('❌ Error en suscripción:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción exitosa - escuchando cambios en tiempo real')
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    const fetchSong = async () => {
      if (!session?.current_song) {
        setCurrentSong(null)
        return
      }

      // Primero buscar en la lista de canciones cargadas (que ya tienen transposeCustom)
      const songInList = songs.find(s => s.id === session.current_song)
      if (songInList) {
        setCurrentSong(songInList)
        return
      }

      // Si no está en la lista, buscar en la base de datos global (sin transposeCustom)
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
  }, [session?.current_song, songs])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const updateSession = async (patch: Partial<LiveSession>) => {
    if (!session) return
    
    console.log('🚀 Actualizando sesión:', patch)
    
    const { data, error } = await supabase
      .from('live_sessions')
      .update(patch)
      .eq('id', session.id)
      .select('id,code,owner_id,current_song,transpose,capo')
      .single()

    if (!error && data) {
      console.log('✅ Sesión actualizada en DB:', data)
      // Actualizar estado local del admin inmediatamente
      setSession(data as LiveSession)
    } else if (error) {
      console.error('❌ Error actualizando sesión:', error)
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
    startPolling(sessionRow.id) // Iniciar polling de respaldo
  }

  const leaveSession = () => {
    setRole('none')
    setSession(null)
    setCurrentSong(null)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Polling de respaldo: verificar cambios cada 2 segundos para oyentes
  const startPolling = (sessionId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    console.log('🔄 Iniciando polling de respaldo cada 2 segundos')
    
    pollingIntervalRef.current = setInterval(async () => {
      if (role !== 'listener') return // Solo para oyentes
      
      const { data, error } = await supabase
        .from('live_sessions')
        .select('id,code,owner_id,current_song,transpose,capo')
        .eq('id', sessionId)
        .single()

      if (!error && data) {
        setSession(prev => {
          // Solo actualizar si hay cambios
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            console.log('🔄 Polling detectó cambios:', data)
            return data as LiveSession
          }
          return prev
        })
      }
    }, 2000)
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

  // Agregar canción a la lista (temporal o carpeta)
  const addSongToList = async (song: Song) => {
    // Verificar si ya está en la lista
    if (songs.find(s => s.id === song.id)) {
      alert('⚠️ Esta canción ya está en la lista')
      return
    }

    // Si hay carpeta seleccionada, agregar a la carpeta
    if (selectedFolderId && user) {
      const { error } = await supabase
        .from('folder_songs')
        .insert({
          folder_id: selectedFolderId,
          song_id: song.id
        })

      if (error) {
        console.error('Error agregando canción:', error)
        alert('❌ Error agregando a carpeta: ' + error.message)
        return
      }
      
      // Recargar canciones de la carpeta
      await loadSongsForFolder(selectedFolderId)
      alert('✅ Canción agregada a la carpeta')
    } else {
      // Sin carpeta: agregar temporalmente a la lista
      setSongs(prev => [...prev, song])
      alert('✅ Canción agregada temporalmente')
    }

    setShowAddSongModal(false)
    setSearchQuery('')
  }

  // UI cuando no estás en sesión
  if (!session || role === 'none') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-[fadeIn_400ms_ease]">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-purple-500/20 border border-teal-500/30">
            <span className="text-2xl">🎵</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Sesión en vivo</h1>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Lo que haga el administrador (cambiar tono, letra, canción) se reflejará en
            todos los oyentes conectados. Primero creá una sala o unite con un código.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="group rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-900/20 via-slate-950/70 to-slate-950/70 p-6 space-y-4 hover:border-teal-400/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="text-3xl bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                👨‍💼
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">Administrador</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Crea una sala en vivo, seleccioná canciones y controlá el tono para todos
              los oyentes.
            </p>
            <button
              onClick={createSession}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 text-sm font-bold text-white hover:from-teal-400 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-lg">{loading ? '⏳' : '✨'}</span>
              {loading ? 'Creando...' : 'Crear nueva sala'}
            </button>
          </div>

          <div className="group rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 via-slate-950/70 to-slate-950/70 p-6 space-y-4 hover:border-purple-400/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="text-3xl bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                👥
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Oyente</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ingresá el código que te pasó el administrador para seguir la letra y el
              tono en vivo.
            </p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Código de la sala (ej: ABC123)"
              className="w-full rounded-xl bg-slate-900/80 border-2 border-purple-500/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all"
            />
            <button
              onClick={joinSession}
              disabled={loading || !joinCode.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-sm font-bold text-white hover:from-purple-500 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-lg">🚪</span>
              Unirse
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Copiar código al portapapeles
  const copyCode = async () => {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copiando código:', err)
    }
  }

  // UI dentro de la sesión
  return (
    <div className="space-y-3 sm:space-y-6 animate-[fadeIn_400ms_ease]">
      {/* Header sesión - compacto */}
      <div className="flex items-center justify-between gap-3 p-2 sm:p-3 rounded-lg bg-slate-900/80 border border-teal-500/40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-sm sm:text-base animate-pulse">🔴</span>
          <button
            onClick={copyCode}
            className="px-2 sm:px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 transition-all relative"
            title="Copiar código"
          >
            <p className="text-[10px] sm:text-xs font-mono font-bold text-white tracking-wider">
              {session.code}
            </p>
            {copied && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-teal-300 bg-slate-900 px-2 py-0.5 rounded whitespace-nowrap">
                ¡Copiado!
              </span>
            )}
          </button>
          <div className="px-2 sm:px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-[10px] sm:text-xs font-bold text-teal-300">
              {isAdmin ? '👨‍💼 Admin' : '👥 Oyente'}
            </p>
          </div>
        </div>
        <button
          onClick={leaveSession}
          className="px-2 sm:px-3 py-1 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-500/40 transition-all flex items-center gap-1"
        >
          <span className="text-xs sm:text-sm">🚪</span>
          <span className="hidden sm:inline text-[10px] sm:text-xs font-semibold text-red-300">Salir</span>
        </button>
      </div>

      <div className="grid gap-0 md:gap-6 grid-cols-1 md:grid-cols-[280px,minmax(0,1fr)]">
        {/* Panel de control - solo desktop */}
        <div className="hidden md:block rounded-xl sm:rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 via-slate-950/80 to-slate-950/80 p-3 sm:p-5 space-y-3 sm:space-y-5 text-xs shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="text-base sm:text-lg">🎵</span>
              <p className="font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Canción actual</p>
            </div>

            {isAdmin ? (
              <>
                {/* Carpeta */}
                <label className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300 mb-1.5 sm:mb-2">
                  <span>📁</span>
                  Carpeta
                </label>
                <select
                  value={selectedFolderId}
                  onChange={e => {
                    const id = e.target.value
                    setSelectedFolderId(id)
                    loadSongsForFolder(id || undefined)
                  }}
                  className="w-full rounded-lg sm:rounded-xl bg-slate-900/80 border border-purple-500/30 sm:border-2 px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all mb-2 sm:mb-3"
                >
                  <option value="">📁 Todas</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      📂 {f.name}
                    </option>
                  ))}
                </select>

                {/* Canción */}
                <label className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300 mb-1.5 sm:mb-2">
                  <span>🎼</span>
                  Canción
                </label>
                <select
                  value={currentSong?.id || ''}
                  onChange={e => {
                    const songId = e.target.value || null
                    updateSession({ current_song: songId as any })
                  }}
                  className="w-full rounded-lg sm:rounded-xl bg-slate-900/80 border border-purple-500/30 sm:border-2 px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all"
                >
                  <option value="">🚫 Ninguna</option>
                  {songs.map(s => (
                    <option key={s.id} value={s.id}>
                      🎵 {s.title}{s.transposeCustom ? ` (${s.transposeCustom > 0 ? '+' : ''}${s.transposeCustom})` : ''}
                    </option>
                  ))}
                </select>

                {/* Botones anterior / siguiente */}
                <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                  <button
                    onClick={goToPrevSong}
                    className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all hover:scale-105 border border-slate-600 flex items-center justify-center gap-0.5 sm:gap-1"
                  >
                    <span>⬅️</span>
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    onClick={goToNextSong}
                    className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all hover:scale-105 border border-slate-600 flex items-center justify-center gap-0.5 sm:gap-1"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span>➡️</span>
                  </button>
                </div>

                {/* Botón para abrir modal de agregar canción */}
                <button
                  onClick={() => setShowAddSongModal(true)}
                  className="mt-2 sm:mt-3 w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all hover:scale-105 border border-purple-600 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg"
                >
                  <span className="text-sm sm:text-base">🔍</span>
                  <span className="hidden sm:inline">Buscar y agregar canción</span>
                  <span className="sm:hidden">Agregar</span>
                </button>

                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 sm:mt-2">
                  {selectedFolderId 
                    ? '📁 Se agregará a la carpeta' 
                    : '⏱️ Agregará temporalmente'}
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

          <div className="border-t border-purple-500/20 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg">🎸</span>
              <p className="font-bold text-xs sm:text-sm bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">Tono</p>
            </div>
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-900/60 border border-teal-500/30">
              <p className="text-[11px] sm:text-xs text-slate-300">
                <span className="hidden sm:inline">Semitonos: </span>
                <span className="font-bold text-base sm:text-lg text-teal-300">
                  {session.transpose > 0 ? '+' : ''}{session.transpose}
                </span>
                {currentSong?.transposeCustom !== undefined && currentSong.transposeCustom !== 0 && (
                  <>
                    <span className="text-slate-500 mx-0.5 sm:mx-1">+</span>
                    <span className="font-bold text-xs sm:text-sm text-purple-400">
                      {currentSong.transposeCustom > 0 ? '+' : ''}{currentSong.transposeCustom}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-purple-400/70 ml-0.5 sm:ml-1">(carpeta)</span>
                  </>
                )}
              </p>
              {currentSong?.transposeCustom !== undefined && currentSong.transposeCustom !== 0 && (
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1">
                  Total: <span className="font-bold text-teal-300">
                    {session.transpose + currentSong.transposeCustom > 0 ? '+' : ''}{session.transpose + currentSong.transposeCustom}
                  </span>
                </p>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() =>
                    updateSession({ transpose: session.transpose - 1 })
                  }
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all hover:scale-105 border border-red-500/40"
                >
                  - ½
                </button>
                <button
                  onClick={() => updateSession({ transpose: 0 })}
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 py-1.5 sm:py-2 text-[10px] sm:text-[10px] font-bold transition-all hover:scale-105 border border-slate-600"
                >
                  0
                </button>
                <button
                  onClick={() =>
                    updateSession({ transpose: session.transpose + 1 })
                  }
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-900/40 to-green-800/40 hover:from-green-800/60 hover:to-green-700/60 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all hover:scale-105 border border-green-500/40"
                >
                  + ½
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-purple-500/20 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg">🏚️</span>
              <p className="font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Capo</p>
            </div>
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-900/60 border border-purple-500/30">
              <p className="text-[11px] sm:text-xs text-slate-300">
                <span className="hidden sm:inline">Traste: </span>
                <span className="font-bold text-base sm:text-lg text-purple-300">
                  {session.capo}
                </span>
              </p>
            </div>
            {isAdmin && (
              <input
                type="range"
                min={0}
                max={7}
                value={session.capo}
                onChange={e =>
                  updateSession({ capo: Number(e.target.value) })
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
              />
            )}
          </div>

          {!isAdmin && (
            <p className="text-[9px] sm:text-[10px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-900">
              Tono y capo: controlado por admin.
            </p>
          )}
        </div>

        {/* Visor compartido */}
        <div 
          className="relative p-0 md:p-6 md:rounded-2xl md:border md:border-teal-500/40 md:bg-gradient-to-br md:from-slate-950/80 md:via-teal-950/20 md:to-slate-950/80 md:shadow-[0_0_30px_rgba(20,184,166,0.2)]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentSong ? (
            <>
              <SongViewer
                title={currentSong.title}
                tone={currentSong.tone || ''}
                content={currentSong.content || ''}
                externalTranspose={session.transpose + (currentSong.transposeCustom || 0)}
                externalCapo={session.capo}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-12 sm:py-20 text-center">
              <div className="text-4xl sm:text-6xl opacity-30">🎵</div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md px-4">
                No hay canción seleccionada.
                {isAdmin && ' Elegí una desde el panel.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de navegación fijos en pantalla (solo admin) via Portal */}
      {isAdmin && currentSong && songs.length > 1 && createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <button
            onClick={goToPrevSong}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-24 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 flex items-center justify-center opacity-20 hover:opacity-100 transition-all pointer-events-auto"
            aria-label="Canción anterior"
          >
            <span className="text-slate-300 text-sm">←</span>
          </button>
          <button
            onClick={goToNextSong}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-24 rounded-full bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 flex items-center justify-center opacity-20 hover:opacity-100 transition-all pointer-events-auto"
            aria-label="Canción siguiente"
          >
            <span className="text-slate-300 text-sm">→</span>
          </button>
        </div>,
        document.body
      )}

      {/* Botón flotante para abrir panel de control (mobile) via Portal */}
      {createPortal(
        <button
          onClick={() => setControlPanelOpen(true)}
          className="md:hidden fixed bottom-28 right-4 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 shadow-lg flex items-center justify-center z-[120] transition-all"
          aria-label="Abrir panel de control"
        >
          <span className="text-xl">🎵</span>
        </button>,
        document.body
      )}

      {/* Modal del panel de control (mobile) */}
      {controlPanelOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setControlPanelOpen(false)} />
          <div className="relative mx-auto mt-20 w-[92%] max-w-md max-h-[78vh] overflow-auto rounded-2xl bg-gradient-to-br from-purple-900/20 via-slate-950/80 to-slate-950/80 border-2 border-purple-500/40 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎵</span>
                Canción actual
              </h2>
              <button onClick={() => setControlPanelOpen(false)} className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">✕</button>
            </div>
            
            {isAdmin ? (
              <div className="space-y-3">
                {/* Carpeta */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <span>📁</span>
                    Carpeta
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={e => {
                      const id = e.target.value
                      setSelectedFolderId(id)
                      loadSongsForFolder(id || undefined)
                    }}
                    className="w-full rounded-lg bg-slate-900/80 border border-purple-500/30 px-3 py-2 text-xs font-medium focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  >
                    <option value="">📁 Todas</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                        📂 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Canción */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <span>🎼</span>
                    Canción
                  </label>
                  <select
                    value={currentSong?.id || ''}
                    onChange={e => {
                      const songId = e.target.value || null
                      updateSession({ current_song: songId as any })
                    }}
                    className="w-full rounded-lg bg-slate-900/80 border border-purple-500/30 px-3 py-2 text-xs font-medium focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  >
                    <option value="">🚫 Ninguna</option>
                    {songs.map(s => (
                      <option key={s.id} value={s.id}>
                        🎵 {s.title}{s.transposeCustom ? ` (${s.transposeCustom > 0 ? '+' : ''}${s.transposeCustom})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Navegación */}
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevSong}
                    className="flex-1 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 py-2 text-xs font-semibold transition-all border border-slate-600 flex items-center justify-center gap-1"
                  >
                    <span>⬅️</span>
                    Anterior
                  </button>
                  <button
                    onClick={goToNextSong}
                    className="flex-1 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 py-2 text-xs font-semibold transition-all border border-slate-600 flex items-center justify-center gap-1"
                  >
                    Siguiente
                    <span>➡️</span>
                  </button>
                </div>

                {/* Agregar canción */}
                <button
                  onClick={() => {
                    setControlPanelOpen(false)
                    setShowAddSongModal(true)
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 py-3 text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  Agregar canción
                </button>

                {/* Tono */}
                <div className="pt-3 border-t border-slate-700">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <span>🎸</span>
                    Tono
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateSession({ transpose: (session.transpose || 0) - 1 })}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold transition-all border border-slate-600"
                    >
                      -½
                    </button>
                    <div className="flex-1 rounded-lg bg-slate-900/80 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-teal-300">{session.transpose || 0}</span>
                    </div>
                    <button
                      onClick={() => updateSession({ transpose: (session.transpose || 0) + 1 })}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold transition-all border border-slate-600"
                    >
                      +½
                    </button>
                  </div>
                </div>

                {/* Capo */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <span>🎸</span>
                    Capo
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={session.capo || 0}
                    onChange={e => updateSession({ capo: parseInt(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                  <div className="text-center text-xs text-slate-400 mt-1">Traste {session.capo || 0}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">👥</div>
                <p className="text-sm text-slate-300">Modo oyente</p>
                <p className="text-xs text-slate-400">El administrador controla la sesión</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para buscar y agregar canciones */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddSongModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/60 shadow-[0_20px_70px_rgba(168,85,247,0.5)] overflow-hidden animate-[fadeIn_200ms_ease]">
            
            {/* Header */}
            <div className="p-5 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Buscar canción
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedFolderId 
                        ? '📁 Se agregará a la carpeta seleccionada' 
                        : '⏱️ Se agregará temporalmente a la lista'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddSongModal(false)}
                  className="text-2xl hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Buscador */}
              <div className="mt-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Buscar por título..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border-2 border-purple-500/30 text-sm focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-slate-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de canciones */}
            <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🎵</div>
                  <p className="text-sm text-slate-400">
                    {searchQuery ? 'No se encontraron canciones' : 'No hay canciones disponibles'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSongs.map((song) => {
                    const isInList = songs.find(s => s.id === song.id)
                    return (
                      <div
                        key={song.id}
                        className={`group p-4 rounded-xl border-2 transition-all ${
                          isInList
                            ? 'bg-slate-800/40 border-slate-700 opacity-50'
                            : 'bg-slate-900/60 border-purple-500/30 hover:border-purple-400/60 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate flex items-center gap-2">
                              <span>🎵</span>
                              {song.title}
                            </h4>
                            {song.tone && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Tono: <span className="text-teal-400 font-semibold">{song.tone}</span>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => addSongToList(song)}
                            disabled={!!isInList}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                              isInList
                                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white hover:scale-105 shadow-lg'
                            }`}
                          >
                            {isInList ? (
                              <>
                                <span>✓</span>
                                En lista
                              </>
                            ) : (
                              <>
                                <span>➕</span>
                                Agregar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer con contador */}
            <div className="p-4 border-t border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
              <p className="text-xs text-center text-slate-400">
                📊 Mostrando <span className="font-bold text-purple-300">{filteredSongs.length}</span> de <span className="font-bold text-purple-300">{allSongs.length}</span> canciones
                {searchQuery && <span> • Buscando: "<span className="text-white font-semibold">{searchQuery}</span>"</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveSessionPage
