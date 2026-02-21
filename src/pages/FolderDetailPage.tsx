import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cacheFolderDetail, readCachedFolderDetail } from '../lib/offlineFolders'
import type { Song, FolderSong } from '../types'
import ArtistAvatar from '../components/ui/ArtistAvatar'

const FolderDetailPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isLocalFolder = Boolean(id && id.startsWith('local-'))

  const [folderName, setFolderName] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [folderSongs, setFolderSongs] = useState<FolderSong[]>([])
  const [songSearch, setSongSearch] = useState('')
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [libraryQuery, setLibraryQuery] = useState('')
  const [editingTranspose, setEditingTranspose] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [linkShareEnabled, setLinkShareEnabled] = useState(false)
  const [supportsLinkShare, setSupportsLinkShare] = useState(true)
  const [savingSharedCopy, setSavingSharedCopy] = useState(false)
  const LOCAL_FOLDERS_STORAGE_KEY = 'holysong.localFolders.v1'
  const LOCAL_FOLDER_SONGS_STORAGE_KEY = 'holysong.localFolderSongs.v1'

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchLastX = useRef<number | null>(null)
  const touchLastY = useRef<number | null>(null)
  const swipeBlockedByScroll = useRef<boolean>(false)
  const touchStartedOnInteractive = useRef<boolean>(false)
  const minSwipeDistance = 90

  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const FLAT_TO_SHARP: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' }

  const parseTone = (rawTone: string): { root: string; suffix: string } => {
    const tone = (rawTone || '').trim()
    const m = tone.match(/^([A-Ga-g])([#b]?)(.*)$/)
    if (!m) return { root: 'C', suffix: '' }
    const root = `${m[1].toUpperCase()}${m[2] || ''}`
    return {
      root: FLAT_TO_SHARP[root] || root,
      suffix: m[3] || '',
    }
  }

  const transposeTone = (rawTone: string, steps: number) => {
    if (!rawTone?.trim()) return ''
    const { root, suffix } = parseTone(rawTone)
    const idx = NOTES.indexOf(root)
    if (idx === -1) return rawTone
    return `${NOTES[(idx + steps + 12 * 10) % 12]}${suffix}`
  }

  const loadFolderSongs = async (): Promise<FolderSong[] | null> => {
    if (!id) return null
    let res = await supabase
      .from('folder_songs')
      .select('song_id, custom_transpose, order_index, songs(id,title,author,tone)')
      .eq('folder_id', id)
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('song_id', { ascending: true })

    if (res.error && String(res.error.message || '').toLowerCase().includes('order_index')) {
      res = await supabase
        .from('folder_songs')
        .select('song_id, custom_transpose, songs(id,title,author,tone)')
        .eq('folder_id', id)
        .order('song_id', { ascending: true })
    }

    if (res.data) {
      const folderSongsList = (res.data as FolderSong[]).map((row: any, idx: number) => ({
        ...row,
        order_index: row.order_index ?? idx,
      }))
      setFolderSongs(folderSongsList)
      const list = folderSongsList.map((r: any) => r.songs as Song)
      setSongs(list)
      setCurrentIndex(list.length ? 0 : null)
      return folderSongsList
    }
    return null
  }

  const readLocalFolderSongs = (): Record<string, { song_id: string; custom_transpose: number; order_index: number }[]> => {
    try {
      const raw = localStorage.getItem(LOCAL_FOLDER_SONGS_STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return {}
      return parsed as Record<string, { song_id: string; custom_transpose: number; order_index: number }[]>
    } catch {
      return {}
    }
  }

  const writeLocalFolderSongs = (data: Record<string, { song_id: string; custom_transpose: number; order_index: number }[]>) => {
    try {
      localStorage.setItem(LOCAL_FOLDER_SONGS_STORAGE_KEY, JSON.stringify(data))
    } catch {
      // noop
    }
  }

  const persistLocalFolderSongs = (items: FolderSong[]) => {
    if (!id || !isLocalFolder) return
    const byFolder = readLocalFolderSongs()
    byFolder[id] = items
      .map((fs, idx) => ({
        song_id: fs.song_id,
        custom_transpose: fs.custom_transpose || 0,
        order_index: fs.order_index ?? idx,
      }))
      .sort((a, b) => a.order_index - b.order_index)
    writeLocalFolderSongs(byFolder)
  }

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return

      if (isLocalFolder) {
        let localFolderName = 'Carpeta local'
        try {
          const raw = localStorage.getItem(LOCAL_FOLDERS_STORAGE_KEY)
          const local = raw ? (JSON.parse(raw) as any[]) : []
          const found = local.find(f => f.id === id)
          if (found) {
            localFolderName = found.name || 'Carpeta local'
            setIsOwner(found.owner_id === user.id)
            setLinkShareEnabled(false)
            setSupportsLinkShare(false)
          } else {
            setIsOwner(true)
            setLinkShareEnabled(false)
            setSupportsLinkShare(false)
          }
        } catch {
          setIsOwner(true)
          setLinkShareEnabled(false)
          setSupportsLinkShare(false)
        }
        setFolderName(localFolderName)

        const all = await supabase.from('songs').select('id,title,author,tone').order('title', {
          ascending: true,
        })
        const baseSongs = (all.data || []) as Song[]
        setAllSongs(baseSongs)

        const byFolder = readLocalFolderSongs()
        let saved = byFolder[id] || []

        if (!saved.length && baseSongs.length > 0) {
          const seed = baseSongs.slice(0, 5).map((s, idx) => ({
            song_id: s.id,
            custom_transpose: 0,
            order_index: idx,
          }))
          byFolder[id] = seed
          writeLocalFolderSongs(byFolder)
          saved = seed
        }

        const localFolderSongs = saved
          .sort((a, b) => a.order_index - b.order_index)
          .map(item => {
            const song = baseSongs.find(s => s.id === item.song_id)
            if (!song) return null
            return {
              folder_id: id,
              song_id: item.song_id,
              custom_transpose: item.custom_transpose || 0,
              order_index: item.order_index,
              songs: song,
            } as FolderSong
          })
          .filter(Boolean) as FolderSong[]

        setFolderSongs(localFolderSongs)
        const localSongsList = localFolderSongs.map(fs => fs.songs as Song)
        setSongs(localSongsList)
        setCurrentIndex(localSongsList.length ? 0 : null)
        return
      }

      let folderRes = await supabase
        .from('folders')
        .select('name, owner_id, is_link_shared')
        .eq('id', id)
        .single()

      if (folderRes.error) {
        setSupportsLinkShare(false)
        folderRes = (await supabase.from('folders').select('name, owner_id').eq('id', id).single()) as any
      }

      if (folderRes.data) {
        setFolderName((folderRes.data as any).name)
        setIsOwner((folderRes.data as any).owner_id === user.id)
        setLinkShareEnabled(Boolean((folderRes.data as any).is_link_shared))
      }

      const loadedFolderSongs = await loadFolderSongs()

      const all = await supabase.from('songs').select('id,title,author,tone').order('title', {
        ascending: true,
      })
      if (all.data) setAllSongs(all.data as Song[])

      if (folderRes.data && loadedFolderSongs && all.data) {
        cacheFolderDetail({
          folderId: id,
          folderName: (folderRes.data as any).name || 'Carpeta',
          ownerId: (folderRes.data as any).owner_id || null,
          isOwner: (folderRes.data as any).owner_id === user.id,
          linkShareEnabled: Boolean((folderRes.data as any).is_link_shared),
          supportsLinkShare,
          folderSongs: loadedFolderSongs,
          allSongs: all.data as Song[],
        })
      } else {
        const cached = readCachedFolderDetail(id)
        if (cached) {
          setFolderName(cached.folderName)
          setIsOwner(cached.ownerId === user.id || cached.isOwner)
          setLinkShareEnabled(cached.linkShareEnabled)
          setSupportsLinkShare(cached.supportsLinkShare)
          setFolderSongs(cached.folderSongs)
          const cachedSongs = cached.folderSongs
            .map(fs => fs.songs as Song)
            .filter(Boolean)
          setSongs(cachedSongs)
          setAllSongs(cached.allSongs)
          setCurrentIndex(cachedSongs.length ? 0 : null)
          alert('Sin conexion: mostrando la ultima carpeta guardada en este dispositivo.')
        }
      }
    }

    load()
  }, [id, user, isLocalFolder])

  const canEdit = isOwner

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null
    touchStartedOnInteractive.current = !!target?.closest('button, input, textarea, select, a, [role="button"]')
    touchStartX.current = e.targetTouches[0].clientX
    touchStartY.current = e.targetTouches[0].clientY
    touchLastX.current = e.targetTouches[0].clientX
    touchLastY.current = e.targetTouches[0].clientY
    swipeBlockedByScroll.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchLastX.current = e.targetTouches[0].clientX
    touchLastY.current = e.targetTouches[0].clientY

    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = touchLastX.current - touchStartX.current
    const dy = touchLastY.current - touchStartY.current
    if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
      swipeBlockedByScroll.current = true
    }
  }

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchStartY.current === null || touchLastX.current === null || touchLastY.current === null) return
    if (touchStartedOnInteractive.current || swipeBlockedByScroll.current) return

    const dx = touchLastX.current - touchStartX.current
    const dy = touchLastY.current - touchStartY.current
    if (Math.abs(dx) < minSwipeDistance || Math.abs(dy) > 36 || Math.abs(dx) <= Math.abs(dy) * 1.5) return

    if (dx > 0) goNextInFolder()
    else if (dx < 0) goPrevInFolder()
  }

  const addToFolder = async (songId: string) => {
    if (!songId || !id) return
    if (isLocalFolder) {
      if (!canEdit) {
        alert('No tenes permiso para editar esta carpeta.')
        return
      }
      if (songs.some(s => s.id === songId)) {
        alert('La cancion ya esta en la carpeta.')
        return
      }
      const added = allSongs.find(s => s.id === songId)
      if (!added) {
        alert('No se encontro la cancion en biblioteca.')
        return
      }
      const nextOrder = songs.length
      const nextFolderSongs = [
        ...folderSongs,
        {
          folder_id: id,
          song_id: songId,
          custom_transpose: 0,
          order_index: nextOrder,
          songs: added,
        },
      ]
      setSongs(prev => [...prev, added])
      setFolderSongs(nextFolderSongs)
      persistLocalFolderSongs(nextFolderSongs)
      return
    }
    if (!canEdit) {
      alert('No tenes permiso para editar esta carpeta.')
      return
    }
    if (songs.some(s => s.id === songId)) {
      alert('La cancion ya esta en la carpeta.')
      return
    }
    if (!user) {
      alert('Debes iniciar sesion')
      return
    }

    const { error } = await supabase
      .from('folder_songs')
      .insert({
        folder_id: id,
        song_id: songId,
        custom_transpose: 0,
        order_index: songs.length,
      })

    if (error) {
      alert('Error agregando cancion: ' + error.message)
      return
    }

    const added = allSongs.find(s => s.id === songId)
    if (added) {
      setSongs(prev => [...prev, added])
      setFolderSongs(prev => [
        ...prev,
        {
          folder_id: id,
          song_id: songId,
          custom_transpose: 0,
          order_index: songs.length,
          songs: added,
        },
      ])
    }
  }

  const updateCustomTranspose = async (songId: string, transpose: number) => {
    if (!id || !canEdit) return
    if (isLocalFolder) {
      const next = folderSongs.map(fs => (fs.song_id === songId ? { ...fs, custom_transpose: transpose } : fs))
      setFolderSongs(next)
      persistLocalFolderSongs(next)
      return
    }

    const { error } = await supabase
      .from('folder_songs')
      .update({ custom_transpose: transpose })
      .eq('folder_id', id)
      .eq('song_id', songId)

    if (error) {
      alert('Error guardando transposicion')
      return
    }

    setFolderSongs(prev => prev.map(fs => (fs.song_id === songId ? { ...fs, custom_transpose: transpose } : fs)))
  }

  const removeFromFolder = async (songId: string) => {
    if (!id || !canEdit) return
    const ok = window.confirm('Sacar esta cancion de la carpeta?')
    if (!ok) return

    if (isLocalFolder) {
      const origIndex = songs.findIndex(s => s.id === songId)
      const newSongs = songs.filter(s => s.id !== songId)
      const nextFolderSongs = folderSongs
        .filter(fs => fs.song_id !== songId)
        .map((fs, idx) => ({ ...fs, order_index: idx }))
      setSongs(newSongs)
      setFolderSongs(nextFolderSongs)
      persistLocalFolderSongs(nextFolderSongs)
      setCurrentIndex(prev => {
        if (!newSongs.length) return null
        if (prev === null) return null
        if (origIndex === -1) return prev
        if (origIndex < prev) return prev - 1
        if (origIndex === prev) return Math.max(0, prev - 1)
        return prev
      })
      return
    }

    const { error } = await supabase.from('folder_songs').delete().eq('folder_id', id).eq('song_id', songId)

    if (error) {
      alert('Error removiendo la cancion: ' + error.message)
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
  }

  const reorderSongs = async (ordered: Song[]) => {
    if (!id || !canEdit) return
    if (isLocalFolder) {
      const nextFolderSongs = ordered.map((song, index) => {
        const match = folderSongs.find(fs => fs.song_id === song.id)
        return {
          folder_id: id,
          song_id: song.id,
          custom_transpose: match?.custom_transpose || 0,
          order_index: index,
          songs: song,
        } as FolderSong
      })
      setSongs(ordered)
      setFolderSongs(nextFolderSongs)
      persistLocalFolderSongs(nextFolderSongs)
      return
    }

    const updates = ordered.map((s, index) => ({
      folder_id: id,
      song_id: s.id,
      order_index: index,
    }))

    const { error } = await supabase.from('folder_songs').upsert(updates, { onConflict: 'folder_id,song_id' })
    if (error) {
      alert('No se pudo guardar el orden.')
      return
    }

    setSongs(ordered)
    setFolderSongs(prev =>
      ordered.map((song, index) => {
        const match = prev.find(fs => fs.song_id === song.id)
        return {
          folder_id: id,
          song_id: song.id,
          custom_transpose: match?.custom_transpose || 0,
          order_index: index,
          songs: song,
        }
      }),
    )
  }

  const moveSong = async (songId: string, direction: -1 | 1) => {
    const index = songs.findIndex(s => s.id === songId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= songs.length) return
    const reordered = [...songs]
    const tmp = reordered[index]
    reordered[index] = reordered[target]
    reordered[target] = tmp
    await reorderSongs(reordered)
  }

  const toggleLinkShare = async () => {
    if (!id || !isOwner) return
    if (!supportsLinkShare) {
      alert('Falta migracion en base de datos para compartir por link.')
      return
    }
    const next = !linkShareEnabled
    const { error } = await supabase.from('folders').update({ is_link_shared: next }).eq('id', id)
    if (error) {
      alert('No se pudo actualizar el link compartido.')
      return
    }
    setLinkShareEnabled(next)
  }

  const saveSharedFolderCopy = async () => {
    if (!user || !id || !folderName) {
      alert('Debes iniciar sesion para guardar la carpeta.')
      return
    }
    if (isOwner) {
      alert('Esta carpeta ya es tuya.')
      return
    }

    const ok = window.confirm(`Deseas guardar esta carpeta en tu cuenta?\n\nSe creara una copia con ${songs.length} canciones.`)
    if (!ok) return

    try {
      setSavingSharedCopy(true)
      const copyName = `${folderName} (copia)`
      const { data: createdFolder, error: createFolderError } = await supabase
        .from('folders')
        .insert({ name: copyName, owner_id: user.id })
        .select('id')
        .single()

      if (createFolderError || !createdFolder) {
        throw createFolderError || new Error('No se pudo crear la carpeta.')
      }

      if (folderSongs.length > 0) {
        const withOrder = folderSongs.map((fs, idx) => ({
          folder_id: createdFolder.id,
          song_id: fs.song_id,
          custom_transpose: fs.custom_transpose || 0,
          order_index: fs.order_index ?? idx,
        }))

        let insertRes = await supabase.from('folder_songs').insert(withOrder)
        if (insertRes.error && String(insertRes.error.message || '').toLowerCase().includes('order_index')) {
          const withoutOrder = withOrder.map(({ order_index: _omit, ...rest }) => rest)
          insertRes = await supabase.from('folder_songs').insert(withoutOrder as any)
        }
        if (insertRes.error) {
          throw insertRes.error
        }
      }

      alert('Carpeta guardada correctamente en tu cuenta.')
      navigate(`/app/folders/${createdFolder.id}`)
    } catch (err: any) {
      console.error(err)
      alert('No se pudo guardar la carpeta: ' + (err?.message || ''))
    } finally {
      setSavingSharedCopy(false)
    }
  }

  const copyShareLink = async () => {
    if (!id) return
    const link = `${window.location.origin}/app/folders/${id}`
    try {
      await navigator.clipboard.writeText(link)
      alert('Link copiado.')
    } catch {
      window.prompt('Copia este link:', link)
    }
  }

  const goPrevInFolder = () => {
    if (currentIndex === null || !songs.length || currentIndex <= 0) return
    const nextIndex = currentIndex - 1
    setCurrentIndex(nextIndex)
    navigate(`/app/song/${songs[nextIndex].id}?folderId=${id}`)
  }

  const goNextInFolder = () => {
    if (currentIndex === null || !songs.length || currentIndex >= songs.length - 1) return
    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    navigate(`/app/song/${songs[nextIndex].id}?folderId=${id}`)
  }

  return (
    <div className="space-y-3 sm:space-y-5 max-w-5xl mx-auto py-2 sm:py-4" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-400/40 p-3 sm:p-4">
        <h1 className="text-base sm:text-xl font-bold text-slate-100">{folderName}</h1>
        <p className="text-[11px] text-slate-300 mt-1">{songs.length} canciones</p>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/85 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-200">Agregar canciones</h2>
          </div>

          <input
            value={libraryQuery}
            onChange={e => setLibraryQuery(e.target.value)}
            placeholder="Buscar cancion..."
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
          />

          {libraryQuery.trim().length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950/70">
              {allSongs
                .filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase()))
                .slice(0, 50)
                .map(a => (
                  <div key={a.id} className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-900/60 last:border-b-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{a.title}</p>
                      {a.author && <p className="text-[11px] text-slate-400 truncate">{a.author}</p>}
                    </div>
                    <button
                      onClick={() => addToFolder(a.id)}
                      disabled={songs.some(x => x.id === a.id)}
                      className={
                        'rounded-md px-2.5 py-1 text-xs font-bold ' +
                        (songs.some(x => x.id === a.id)
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-500 text-slate-950')
                      }
                      title="Agregar"
                    >
                      +
                    </button>
                  </div>
                ))}
              {allSongs.filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase())).length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-400">No se encontraron canciones.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/85 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200">Canciones de la carpeta</h2>
          <input
            type="text"
            className="w-44 sm:w-56 rounded-lg bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 text-xs outline-none focus:border-purple-500/50"
            value={songSearch}
            onChange={e => setSongSearch(e.target.value)}
            placeholder="Filtrar canciones..."
          />
        </div>

        {songs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">Esta carpeta esta vacia.</div>
        ) : (
          <div className="space-y-2">
            {songs
              .filter(s => s.title.toLowerCase().includes(songSearch.toLowerCase()))
              .map(s => {
                const origIdx = songs.findIndex(x => x.id === s.id)
                const isActive = origIdx === currentIndex
                const folderSong = folderSongs.find(fs => fs.song_id === s.id)
                const customTranspose = folderSong?.custom_transpose || 0
                const isEditing = editingTranspose === s.id
                const originalTone = s.tone || 'C'
                const transposedTone = customTranspose !== 0 ? transposeTone(originalTone, customTranspose) : null

                return (
                  <div
                    key={s.id}
                    className={
                      'rounded-lg border px-3 py-2 transition-all ' +
                      (isActive
                        ? 'border-teal-400 bg-gradient-to-r from-teal-900/30 to-slate-900/30 shadow-lg shadow-teal-500/10'
                        : 'border-slate-700 bg-slate-900/55 hover:border-purple-500/50')
                    }
                    onClick={() => {
                      setCurrentIndex(origIdx === -1 ? null : origIdx)
                      navigate(`/app/song/${s.id}?folderId=${id}`)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setCurrentIndex(origIdx === -1 ? null : origIdx)
                        navigate(`/app/song/${s.id}?folderId=${id}`)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <ArtistAvatar author={s.author} sizeClassName={isActive ? 'w-12 h-12' : 'w-8 h-8'} />
                        {canEdit && (
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onTouchStart={e => e.stopPropagation()}
                            onClick={e => {
                              e.stopPropagation()
                              removeFromFolder(s.id)
                            }}
                            className="rounded bg-red-700 hover:bg-red-600 px-1.5 py-0.5 text-[10px] leading-none"
                            title="Sacar"
                          >
                            DEL
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{s.title}</p>
                        {s.author && <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.author}</p>}
                        {s.tone && (
                          <p className="text-[11px] text-slate-300 mt-1">
                            Tono {originalTone}
                            {transposedTone ? ` - ${transposedTone}` : ''}
                            {customTranspose !== 0 ? ` ${customTranspose > 0 ? '+' : ''}${customTranspose}` : ''}
                          </p>
                        )}

                      </div>

                      <div className="flex items-center gap-1 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                        {canEdit && (isEditing ? (
                          <>
                            <button
                              onClick={() => updateCustomTranspose(s.id, customTranspose - 1)}
                              className="rounded bg-slate-700 hover:bg-slate-600 px-2 py-1 text-[11px]"
                              title="Bajar tono (-1)"
                            >
                              -
                            </button>
                            <button
                              onClick={() => setEditingTranspose(null)}
                              className="rounded bg-purple-700/80 hover:bg-purple-600 px-2 py-1 text-[11px]"
                              title="Cerrar tono"
                            >
                              Tono
                            </button>
                            <button
                              onClick={() => updateCustomTranspose(s.id, customTranspose + 1)}
                              className="rounded bg-slate-700 hover:bg-slate-600 px-2 py-1 text-[11px]"
                              title="Subir tono (+1)"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingTranspose(s.id)}
                            className="rounded bg-purple-700/80 hover:bg-purple-600 px-2 py-1 text-[11px]"
                            title="Abrir control de tono"
                          >
                            Tono
                          </button>
                        ))}

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveSong(s.id, -1)}
                            className="rounded bg-teal-700/80 hover:bg-teal-600 px-2 py-1 text-[11px] font-bold leading-none"
                            title="Subir cancion"
                          >
                            +
                          </button>
                          <button
                            onClick={() => moveSong(s.id, 1)}
                            className="rounded bg-slate-700 hover:bg-slate-600 px-2 py-1 text-[11px] font-bold leading-none"
                            title="Bajar cancion"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {!isOwner && linkShareEnabled && (
        <div className="rounded-xl border border-teal-500/35 bg-teal-500/10 p-3 sm:p-4 space-y-2">
          <h2 className="text-xs sm:text-sm font-bold text-teal-200">Carpeta compartida</h2>
          <p className="text-[11px] text-slate-300">Deseas guardar esta carpeta en tu cuenta para usarla luego?</p>
          <button
            onClick={saveSharedFolderCopy}
            disabled={savingSharedCopy}
            className="rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-60"
          >
            {savingSharedCopy ? 'Guardando...' : 'Guardar carpeta'}
          </button>
        </div>
      )}

      {isOwner && (
        <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/85 p-3 sm:p-4 space-y-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200">Compartir por link</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLinkShare}
              className={
                'rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold ' +
                (linkShareEnabled ? 'bg-teal-600 hover:bg-teal-500' : 'bg-slate-700 hover:bg-slate-600')
              }
            >
              {linkShareEnabled ? 'Link activo' : 'Activar link'}
            </button>
            <button
              onClick={copyShareLink}
              disabled={!linkShareEnabled}
              className="rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              Copiar link
            </button>
          </div>
          {!supportsLinkShare && <p className="text-[11px] text-amber-300">Falta ejecutar la migracion de link compartido en Supabase.</p>}
        </div>
      )}

    </div>
  )
}

export default FolderDetailPage
