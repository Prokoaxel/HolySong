import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import SongViewer from '../components/songs/SongViewerFixed'
import { cacheSongDetail, readCachedSongDetail } from '../lib/offlineSongs'
import type { DbSong, DbVersion, Comment } from '../types'

type Instrument = 'guitar' | 'piano' | 'bass'

/* NOTE: handleDeleteVersion moved inside component so it can access state setters */


const SongPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folderId')
  const { user } = useAuth()
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [savingVersion, setSavingVersion] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [song, setSong] = useState<DbSong | null>(null)
  const [versions, setVersions] = useState<DbVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<'base' | string>('base')
  const [searchText, setSearchText] = useState('')

  // Estados para navegación de carpeta
  const [folderSongs, setFolderSongs] = useState<{id: string; title: string; custom_transpose?: number}[]>([])
  const [currentIndexInFolder, setCurrentIndexInFolder] = useState<number>(-1)
  const [folderCustomTranspose, setFolderCustomTranspose] = useState<number>(0)

  // Controls lifted for unified stripe
  const [fontSize, setFontSize] = useState<number>(14)
  const [transposeSteps, setTransposeSteps] = useState<number>(0)
  const [capo, setCapo] = useState<number>(0)
  const [bpm, setBpm] = useState<number>(80)
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false)
  const [autoScrollOn, setAutoScrollOn] = useState<boolean>(false)
  const [scrollSpeed, setScrollSpeed] = useState<number>(1)
  const [instrument, setInstrument] = useState<Instrument>('guitar')
  const [versionsOpen, setVersionsOpen] = useState<boolean>(false)
  const [folders, setFolders] = useState<{id:string; name:string}[]>([])
  const [folderModalOpen, setFolderModalOpen] = useState<boolean>(false)
  const [newFolderName, setNewFolderName] = useState<string>('')
  const [addingToFolder, setAddingToFolder] = useState<boolean>(false)

  // Estados para comentarios
  const [comments, setComments] = useState<Comment[]>([])
  const [commentMode, setCommentMode] = useState<boolean>(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null)
  const [commentDraft, setCommentDraft] = useState<string>('')
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false)
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null)
  // Mobile overlay for controls panel
  const [controlsOpen, setControlsOpen] = useState<boolean>(false)
  // Mobile transpose panel toggle
  const [transposeOpen, setTransposeOpen] = useState<boolean>(false)

  // Helper: compute transpose steps from base song tone to target note
  const computeStepsTo = (target: string) => {
    const base = (song?.tone ?? 'C') as string
    const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    const fromIdx = NOTES.indexOf(base)
    const toIdx = NOTES.indexOf(target)
    if (fromIdx === -1 || toIdx === -1) return transposeSteps
    let steps = toIdx - fromIdx
    if (steps > 6) steps -= 12
    if (steps < -6) steps += 12
    return steps
  }

  // =========================
  // Cargar canción + versiones
  // =========================
  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select('id,title,author,tone,content')
          .eq('id', id)
          .single()

        if (songError || !songData) {
          console.error(songError)
          const cachedSong = readCachedSongDetail(id)
          if (cachedSong) {
            setSong(cachedSong)
            setVersions([])
            setError('Sin conexión: mostrando la última versión guardada en este dispositivo.')
            setLoading(false)
            return
          }
          setError('No se pudo cargar la canción.')
          setLoading(false)
          return
        }
        setSong(songData as DbSong)
        cacheSongDetail(songData as DbSong)

        const { data: versionData, error: versionError } = await supabase
          .from('song_versions')
          .select('id,song_id,version_label,tone,content,created_at')
          .eq('song_id', id)
          .order('created_at', { ascending: true })

        if (versionError) {
          console.error(versionError)
          setError('No se pudieron cargar las versiones.')
        } else {
          setVersions((versionData || []) as DbVersion[])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  // Cargar carpetas del usuario
  useEffect(() => {
    const loadFolders = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('folders')
        .select('id,name')
        .eq('owner_id', user.id)
        .order('name', { ascending: true })
      if (!error && data) {
        setFolders(data as any)
      }
    }
    loadFolders()
  }, [user])

  // Cargar comentarios de la canción FILTRADOS POR VERSION
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return
      
      // Convertir selectedVersionId: 'base' queda como null en la BD
      const versionFilter = selectedVersionId === 'base' ? null : selectedVersionId
      
      const { data, error } = await supabase
        .from('song_comments')
        .select('*')
        .eq('song_id', id)
        .eq('version_id', versionFilter)
        .order('created_at', { ascending: true })
      if (!error && data) {
        setComments(data as Comment[])
      }
    }
    loadComments()
  }, [id, selectedVersionId])  // Recargar cuando cambia la versión

  // Cargar canciones de la carpeta si viene desde una carpeta
  useEffect(() => {
    const loadFolderSongs = async () => {
      if (!folderId || !id) return
      
      const { data, error } = await supabase
        .from('folder_songs')
        .select('song_id, custom_transpose, songs(id, title)')
        .eq('folder_id', folderId)
      
      if (!error && data) {
        const songList = data.map((r: any) => ({
          id: r.songs.id,
          title: r.songs.title,
          custom_transpose: r.custom_transpose || 0
        }))
        setFolderSongs(songList)
        const currentIdx = songList.findIndex((s: any) => s.id === id)
        setCurrentIndexInFolder(currentIdx)
        
        // Aplicar la transposición personalizada de esta canción en esta carpeta
        if (currentIdx >= 0) {
          const customTrans = songList[currentIdx].custom_transpose || 0
          setFolderCustomTranspose(customTrans)
          setTransposeSteps(customTrans)
        }
      }
    }
    loadFolderSongs()
  }, [folderId, id])

  // Funciones de navegación en carpeta
  const goPrevInFolder = () => {
    if (currentIndexInFolder <= 0 || folderSongs.length === 0) return
    const prevSong = folderSongs[currentIndexInFolder - 1]
    navigate(`/app/song/${prevSong.id}?folderId=${folderId}`)
  }

  const goNextInFolder = () => {
    if (currentIndexInFolder < 0 || currentIndexInFolder >= folderSongs.length - 1) return
    const nextSong = folderSongs[currentIndexInFolder + 1]
    navigate(`/app/song/${nextSong.id}?folderId=${folderId}`)
  }

  // =========================
  // Metrónomo
  // =========================
  useEffect(() => {
    if (!metronomeOn) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const interval = 60000 / bpm // ms por beat
    let nextBeatTime = audioContext.currentTime
    let timerId: number | undefined
    let beatCount = 0

    const playClick = (isAccent: boolean) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Primer beat: tono más alto y fuerte
      oscillator.frequency.value = isAccent ? 1200 : 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(isAccent ? 0.5 : 0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)
    }

    const scheduleBeat = () => {
      while (nextBeatTime < audioContext.currentTime + 0.1) {
        playClick(beatCount % 4 === 0)
        beatCount++
        nextBeatTime += interval / 1000
      }
      timerId = window.setTimeout(scheduleBeat, 25)
    }

    scheduleBeat()

    return () => {
      if (timerId !== undefined) clearTimeout(timerId)
      audioContext.close()
    }
  }, [metronomeOn, bpm])

  // =========================
  // Auto-scroll
  // =========================
  useEffect(() => {
    if (!autoScrollOn || !lyricsContainerRef.current) return

    const scrollInterval = setInterval(() => {
      if (lyricsContainerRef.current) {
        lyricsContainerRef.current.scrollBy({
          top: scrollSpeed * 2,
          behavior: 'auto'
        })
      }
    }, 50)

    return () => clearInterval(scrollInterval)
  }, [autoScrollOn, scrollSpeed])

  // =========================
  // Versión seleccionada
  // =========================
  const selectedVersion = useMemo(
    () => versions.find(v => String(v.id) === String(selectedVersionId)),
    [versions, selectedVersionId],
  )

  const currentTitle = song?.title ?? ''
  const baseTone = selectedVersion?.tone ?? song?.tone ?? ''
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const currentTone = useMemo(() => {
    const base = (baseTone || '') as string
    const idx = NOTES.indexOf(base)
    if (idx === -1) return base
    const newIndex = (idx + transposeSteps + 12) % 12
    return NOTES[newIndex]
  }, [baseTone, transposeSteps])
  const currentContent = selectedVersion?.content ?? song?.content ?? ''

  // =========================
  // Crear versión desde la actual
  // =========================
  const handleCreateVersion = async () => {
    if (!song || !id) return
    if (!user) {
      alert('Tenés que iniciar sesión para crear versiones.')
      return
    }

    const label = window.prompt(
      'Nombre de la nueva versión (ej: Acústico, Arreglo, En vivo)...',
      '',
    )
    if (!label) return

    const baseTone = selectedVersion?.tone ?? song.tone ?? ''
    const baseContent = selectedVersion?.content ?? song.content ?? ''

    setSavingVersion(true)
    try {
      const { data, error: insertError } = await supabase
        .from('song_versions')
        .insert({
          song_id: song.id,
          version_label: label,
          tone: baseTone,
          content: baseContent,
        })
        .select('id, song_id, version_label, tone, content, created_at')
        .single()

      if (insertError || !data) {
        console.error(insertError)
        alert(
          'Error creando versión: ' +
            (insertError?.message ?? 'revisá la consola'),
        )
        return
      }

      const newVersion = data as DbVersion
      // Tras crear, refetch para asegurar sincronización con la BD
      try {
        const { data: versionData, error: versionError } = await supabase
          .from('song_versions')
          .select('id,song_id,version_label,tone,content,created_at')
          .eq('song_id', id)
          .order('created_at', { ascending: true })

        if (!versionError && versionData) {
          setVersions(versionData as DbVersion[])
        } else {
          // Fallback: agregar localmente
          setVersions(prev => [...prev, newVersion])
        }
      } catch {
        setVersions(prev => [...prev, newVersion])
      }
      setSelectedVersionId(String(newVersion.id))
    } finally {
      setSavingVersion(false)
    }
  }

  // =========================
  // Ir al editor (canción base / versión)
  // =========================
  const handleEditSong = () => {
    if (!song) return
    navigate(`/app/import?songId=${song.id}`)

  }

  const handleEditVersion = (versionId: string) => {
     navigate(`/app/import?versionId=${versionId}`)
  }

  // =========================
  // Eliminar versión (moved inside component so it has access to state)
  // =========================
  const handleDeleteVersion = async (versionId: string) => {
    const confirmDelete = window.confirm(
      '¿Seguro que querés eliminar esta versión? Esta acción no se puede deshacer.'
    )
    if (!confirmDelete) return

    if (!id) {
      alert('No hay canción cargada.')
      return
    }

    const { error } = await supabase
      .from('song_versions')
      .delete()
      .eq('id', versionId)
      .eq('song_id', id)

    if (error) {
      console.error(error)
      alert('Error eliminando versión: ' + error.message)
      return
    }

    // Sacamos la versión del estado
    setVersions(prev => prev.filter(v => v.id !== versionId))

    // Si la versión eliminada era la que estaba seleccionada, volvemos a la base
    setSelectedVersionId(prev => (prev === versionId ? 'base' : prev))
  }

  // =========================
  // Agregar a carpeta
  // =========================
  const handleAddToFolder = () => {
    if (!song) return
    if (!user) {
      alert('Tenés que iniciar sesión para agregar a una carpeta.')
      return
    }
    setFolderModalOpen(true)
  }

  const confirmAddToFolder = async (folderId: string) => {
    if (!song) return
    setAddingToFolder(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) {
      alert('Debes iniciar sesión')
      setAddingToFolder(false)
      return
    }
    const resp = await fetch(`/api/folders/${folderId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ song_id: song.id }),
    })
    setAddingToFolder(false)
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      console.error('API add to folder failed:', err)
      // Fallback: intentar directamente con Supabase cliente (RLS)
      const { error: directErr } = await supabase
        .from('folder_songs')
        .insert({ folder_id: folderId, song_id: song.id })
      if (directErr) {
        // si es duplicado, lo tratamos como éxito
        const code = (directErr as any)?.code || ''
        if (code === '23505') {
          setFolderModalOpen(false)
          alert('La canción ya estaba en la carpeta.')
          return
        }
        alert('Error agregando canción a la carpeta.' + (directErr?.message ? `\n${directErr.message}` : ''))
        return
      }
      setFolderModalOpen(false)
      alert('Canción agregada a la carpeta correctamente.')
      return
    }
    setFolderModalOpen(false)
    alert('Canción agregada a la carpeta correctamente.')
  }

  const createFolderAndAdd = async () => {
    if (!user || !newFolderName.trim()) return
    setAddingToFolder(true)
    const { data: created, error: createError } = await supabase
      .from('folders')
      .insert({ name: newFolderName.trim(), owner_id: user.id })
      .select('id,name')
      .single()
    if (createError || !created) {
      console.error(createError)
      alert('Error creando carpeta.')
      setAddingToFolder(false)
      return
    }
    setFolders(prev => [...prev, created as any])
    setNewFolderName('')
    await confirmAddToFolder((created as any).id)
  }

  // =========================
  // Buscar otra canción
  // =========================
  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter' && searchText.trim()) {
      navigate(`/app/library?query=${encodeURIComponent(searchText.trim())}`)
    }
  }

  // =========================
  // Manejo de comentarios
  // =========================
  const handleAddComment = async () => {
    if (!user || !id || !commentDraft.trim() || !selectionRange) return

    try {
      // Guardar con la versión actual: 'base' -> null, o el ID de la versión
      const versionToSave = selectedVersionId === 'base' ? null : selectedVersionId
      
      const { data, error } = await supabase
        .from('song_comments')
        .insert({
          song_id: id,
          version_id: versionToSave,  // Vincular comentario a la versión actual
          user_id: user.id,
          user_email: user.email || 'Usuario',
          text_selection: selectedText,
          comment_text: commentDraft.trim(),
          position_start: selectionRange.start,
          position_end: selectionRange.end,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setComments(prev => [...prev, data as Comment])
        setCommentDraft('')
        setShowCommentForm(false)
        setCommentMode(false)
        setSelectedText('')
        setSelectionRange(null)
      }
    } catch (err: any) {
      console.error('Error agregando comentario:', err)
      alert('Error al agregar comentario: ' + err.message)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const confirm = window.confirm('¿Eliminar este comentario?')
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('song_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      setExpandedCommentId(null)
    } catch (err: any) {
      console.error('Error eliminando comentario:', err)
      alert('Error al eliminar comentario: ' + err.message)
    }
  }

  const handleTextSelection = () => {
    if (!commentMode) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const text = selection.toString().trim()
    if (!text) return

    // Calcular posición absoluta en el contenido completo
    const range = selection.getRangeAt(0)
    
    // Obtener el elemento contenedor del contenido
    const contentElement = document.querySelector('.song-content-container')
    if (!contentElement) return
    
    // Obtener todo el texto del contenedor
    const fullText = contentElement.textContent || ''
    
    // Crear un range temporal desde el inicio del contenedor hasta el inicio de la selección
    const preRange = document.createRange()
    preRange.selectNodeContents(contentElement)
    preRange.setEnd(range.startContainer, range.startOffset)
    
    // La posición absoluta es la longitud del texto antes de la selección
    const absoluteStart = preRange.toString().length
    const absoluteEnd = absoluteStart + text.length

    setSelectedText(text)
    setSelectionRange({ start: absoluteStart, end: absoluteEnd })
    setShowCommentForm(true)
  }

  if (loading && !song) {
    return (
      <div className="px-8 py-10 text-slate-300 fade-in">
        Cargando canción...
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="px-8 py-10 text-red-300 fade-in">
        {error ?? 'No se encontró la canción.'}
      </div>
    )
  }
  // Reusable: contenido del panel izquierdo (usado en desktop y en el modal movil)
  const LeftPanelContent = () => (
    <>
      <div className="rounded-lg bg-slate-900/90 border border-slate-700 p-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="h-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold transition-all active:scale-95">A-</button>
          <button onClick={() => setFontSize(f => Math.min(28, f + 1))} className="h-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold transition-all active:scale-95">A+</button>
          <button onClick={() => setVersionsOpen(v => !v)} className="col-span-2 h-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9px] font-semibold tracking-wide transition-all active:scale-95">VERSIONES</button>
        </div>
      </div>

      {versionsOpen && (
        <div className="rounded-lg bg-slate-900/95 border border-slate-700 p-1.5 max-h-44 overflow-auto scroll-dark">
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => setSelectedVersionId('base')}
              className={'w-full text-left rounded-md px-2 py-1.5 border text-[11px] ' + (String(selectedVersionId) === 'base' ? 'border-teal-400 bg-teal-500/10 text-teal-100' : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500')}
            >
              Principal
            </button>
            {versions.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVersionId(String(v.id))}
                className={'w-full text-left rounded-md px-2 py-1.5 border text-[11px] truncate ' + (String(selectedVersionId) === String(v.id) ? 'border-teal-400 bg-teal-500/10 text-teal-100' : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500')}
              >
                {v.version_label}
              </button>
            ))}
            <button
              onClick={handleCreateVersion}
              disabled={savingVersion}
              className="w-full rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-60 border border-teal-400 text-[11px] text-slate-950 font-semibold py-1.5"
            >
              {savingVersion ? '...' : '+'}
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="h-full overflow-hidden px-0 md:px-6 md:-mt-4 fade-in">
      <div className="grid grid-cols-12 gap-3">
        {/* LEFT COLUMN - unified stripe (desktop only) */}
        <div className={`col-span-12 md:col-span-4 lg:col-span-3 no-print hidden md:block`}>
          <div className={`rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 flex flex-col gap-3 sticky top-0 max-h-screen overflow-auto scroll-dark`}>
            <LeftPanelContent />
          </div>
        </div>

        {/* RIGHT - lyrics viewer (expanded) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 md:sticky md:top-0">
          <div
            id="print-lyrics"
            ref={lyricsContainerRef}
            className="md:rounded-xl bg-transparent md:bg-slate-900 border-0 md:border md:border-slate-700 overflow-y-visible md:overflow-y-auto h-full md:max-h-screen scroll-dark print-only p-0"
          >
            <SongViewer
            key={`${song.id}-${selectedVersionId}`}
            title={currentTitle}
            tone={currentTone}
            content={currentContent}
            musicianMode
            onAddToFolder={handleAddToFolder}
            comments={comments}
            commentMode={commentMode}
            onTextSelection={handleTextSelection}
            expandedCommentId={expandedCommentId}
            onToggleComment={setExpandedCommentId}
            onDeleteComment={handleDeleteComment}
            currentUserId={user?.id}
            onSwipePrev={folderId && folderSongs.length > 0 ? goPrevInFolder : undefined}
            onSwipeNext={folderId && folderSongs.length > 0 ? goNextInFolder : undefined}
            controls={{
              fontSize,
              setFontSize,
              transposeSteps,
              setTransposeSteps,
              capo,
              setCapo,
              bpm,
              setBpm,
              metronomeOn,
              setMetronomeOn,
              autoScrollOn,
              setAutoScrollOn,
              scrollSpeed,
              setScrollSpeed,
              instrument,
              setInstrument,
            }}
            />
          </div>
          {/* Controles flotantes en móvil - renderizados via portal para que sean fixed al viewport */}
          {createPortal(
            <>
              {/* Botón transportador/tono - arriba de todo */}
              <div className={`md:hidden fixed right-2 top-[68px] z-50 transition-all duration-300 ${transposeOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button
                  onClick={() => setTransposeOpen(!transposeOpen)}
                  className="w-9 h-9 rounded-lg bg-slate-800/70 border border-teal-500/45 text-slate-100 shadow-lg flex items-center justify-center"
                  aria-label="Cambiar tono"
                  title="Cambiar tono"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 18a2.25 2.25 0 1 0-2.25-2.25V7.5l7-2v8.25" />
                    <path d="m16 10.5 2-2 2 2" />
                    <path d="M18 8.5v7" />
                    <path d="m16 17.5 2 2 2-2" />
                  </svg>
                </button>
              </div>

              {/* Panel de transporte expandido */}
              <div className={`md:hidden fixed right-2 top-[68px] z-50 transition-all duration-300 ${transposeOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="rounded-xl bg-slate-800/95 border border-teal-500/60 px-2.5 py-2 shadow-xl backdrop-blur-sm w-32">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center text-teal-300">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M10 18a2.25 2.25 0 1 0-2.25-2.25V7.5l7-2v8.25" />
                          <path d="m16 10.5 2-2 2 2" />
                          <path d="M18 8.5v7" />
                          <path d="m16 17.5 2 2 2-2" />
                        </svg>
                      </span>
                      <span className="text-[11px] font-bold text-teal-300">{currentTone || song?.tone || 'C'}</span>
                    </div>
                    <button
                      onClick={() => setTransposeOpen(false)}
                      className="h-8 w-8 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center text-lg leading-none"
                      aria-label="Cerrar transponer"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-1.5">
                    {['C','D','E','F','G','A','B'].map(n => (
                      <button key={n} onClick={() => setTransposeSteps(computeStepsTo(n))} className={'rounded py-1 text-[10px] font-bold transition-all active:scale-95 ' + (currentTone === n ? 'bg-teal-400 text-slate-950' : 'bg-slate-700 text-slate-300')}>{n}</button>
                    ))}
                    <button onClick={() => setTransposeSteps(0)} className="rounded py-1 text-[9px] font-bold bg-slate-700 text-slate-400" title="Reset">R</button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setTransposeSteps(s => Math.max(-12, s - 1))} className="flex-1 rounded bg-slate-700 py-1 text-[10px] font-semibold text-slate-300">-1/2</button>
                    <button onClick={() => setTransposeSteps(s => Math.min(12, s + 1))} className="flex-1 rounded bg-slate-700 py-1 text-[10px] font-semibold text-slate-300">+1/2</button>
                  </div>
                </div>
              </div>

              {/* Botón engranaje - se empuja hacia abajo cuando transpose está abierto */}
              <div className={`md:hidden fixed right-2 z-50 transition-all duration-300 ${transposeOpen ? 'top-[266px]' : 'top-[168px]'}`}>
                <button
                  onClick={() => setControlsOpen(v => !v)}
                  className={
                    'w-9 h-9 rounded-lg text-slate-100 shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 ' +
                    (controlsOpen
                      ? 'opacity-0 scale-110 pointer-events-none bg-slate-700/85 border border-teal-400/70 shadow-teal-500/30'
                      : 'opacity-100 scale-100 bg-slate-800/70 border border-slate-500/70')
                  }
                  aria-label="Abrir controles"
                  title="Controles"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
                  </svg>
                </button>
              </div>

              {/* Botón carpeta - se empuja hacia abajo cuando transpose está abierto */}
              <div className={`md:hidden fixed right-2 z-50 transition-all duration-300 ${transposeOpen ? 'top-[216px]' : 'top-[118px]'}`}>
                <button
                  onClick={handleAddToFolder}
                  className={
                    'w-9 h-9 rounded-lg text-slate-100 shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 ' +
                    (folderModalOpen
                      ? 'opacity-0 scale-110 pointer-events-none bg-slate-700/85 border border-purple-400/70 shadow-purple-500/30'
                      : 'opacity-100 scale-100 bg-slate-800/70 border border-purple-500/45')
                  }
                  aria-label="Agregar a carpeta"
                  title="Agregar a carpeta"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {/* Mini panel de configuracion movil */}
      <div className={`md:hidden fixed right-2 z-50 origin-top-right transition-all duration-300 ${transposeOpen ? 'top-[266px]' : 'top-[168px]'} ${controlsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-[132px] rounded-xl bg-slate-800/95 border border-slate-500/70 px-1.5 py-1.5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setControlsOpen(false)}
                className="h-8 w-8 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center text-lg leading-none"
                aria-label="Cerrar configuracion"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <LeftPanelContent />
            </div>
          </div>
        </div>

      {/* Modal para agregar comentario - Diseño mejorado */}
      {showCommentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCommentForm(false)} />
          <div className="relative w-[92%] max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/60 shadow-[0_20px_70px_rgba(168,85,247,0.5)] overflow-hidden animate-[fadeIn_200ms_ease]">
            {/* Glow decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
            
            <div className="relative p-5">
              {/* Header con iconos animados */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md animate-pulse" />
                  <span className="relative text-3xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Agregar Comentario</h3>
                  <p className="text-[10px] text-slate-400">Deja tu anotación sobre esta parte de la letra</p>
                </div>
              </div>
              
              {/* Texto seleccionado con diseño destacado */}
              <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-purple-900/40 border border-purple-500/30 p-4 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">📝</span>
                    <p className="text-[11px] text-purple-300 font-semibold uppercase tracking-wide">Fragmento seleccionado</p>
                  </div>
                  <p className="text-sm text-teal-200 italic font-medium leading-relaxed">&quot;{selectedText}&quot;</p>
                </div>
              </div>
              
              {/* Textarea mejorado */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2 font-medium">
                  <span>✍️</span>
                  Tu comentario
                </label>
                <textarea
                  value={commentDraft}
                  onChange={e => setCommentDraft(e.target.value)}
                  placeholder="Escribe aquí tu anotación, idea o sugerencia..."
                  className="w-full h-28 rounded-xl bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-3 text-sm resize-none transition-all outline-none placeholder:text-slate-500"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>💡 Tip: Sé claro y específico</span>
                  <span>{commentDraft.length} caracteres</span>
                </div>
              </div>
              
              {/* Botones con efectos */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCommentForm(false)
                    setCommentDraft('')
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!commentDraft.trim()}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>💾</span>
                  Guardar comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal seleccionar carpeta */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setFolderModalOpen(false)} />
          <div className="relative w-[92%] max-w-md rounded-2xl bg-slate-950 border border-slate-700 p-4 text-slate-100">
            <h3 className="text-base font-semibold mb-2">Agregar a carpeta</h3>
            <p className="text-[12px] text-slate-400 mb-3">Elegí una carpeta existente o creá una nueva.</p>
            <div className="max-h-48 overflow-auto rounded-md border border-slate-700 mb-3">
              {folders.length === 0 ? (
                <p className="text-[12px] text-slate-400 p-3">No tenés carpetas aún.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {folders.map(f => (
                    <li key={f.id}>
                      <button disabled={addingToFolder} onClick={()=>confirmAddToFolder(f.id)} className="w-full text-left px-3 py-2 hover:bg-slate-800/60">
                        {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-md border border-slate-700 p-2 mb-3">
              <p className="text-[12px] text-slate-400 mb-1">Crear nueva carpeta</p>
              <div className="flex gap-2">
                <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="Nombre de carpeta" className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[12px]" />
                <button disabled={addingToFolder || !newFolderName.trim()} onClick={createFolderAndAdd} className="rounded bg-teal-600 hover:bg-teal-500 px-3 text-[12px] text-slate-950 font-semibold">Crear y agregar</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setFolderModalOpen(false)} className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]">Cancelar</button>
              <button disabled className="px-3 py-1 rounded bg-slate-700 text-[12px] opacity-60">Seleccioná una carpeta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SongPage


