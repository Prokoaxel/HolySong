import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Song } from '../types'

const FolderDetailPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [folderName, setFolderName] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [songSearch, setSongSearch] = useState('')
  const [allSongs, setAllSongs] = useState<Song[]>([])
  // input for searching the global library inside the folder page
  const [libraryQuery, setLibraryQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return

      const f = await supabase.from('folders').select('name').eq('id', id).single()
      if (f.data) setFolderName(f.data.name)

      const res = await supabase
        .from('folder_songs')
        .select('song_id, songs(title,id)')
        .eq('folder_id', id)

      if (res.data) {
        const list = res.data.map((r: any) => r.songs as Song)
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

  // add a song by id to the current folder (server-side)
  const addToFolder = async (songId: string) => {
    if (!songId || !id) return
    if (songs.some(s => s.id === songId)) {
      alert('La canción ya está en la carpeta.')
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return alert('Debes iniciar sesión')

    const resp = await fetch(`/api/folders/${id}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ song_id: songId }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      alert('Error agregando canción: ' + (err.error || resp.statusText))
      return
    }

    const added = allSongs.find(s => s.id === songId)
    if (added) {
      setSongs(prev => [...prev, added])
    }
    alert('Canción agregada')
  }

  const removeFromFolder = async (songId: string) => {
    if (!id) return
    const ok = window.confirm('¿Sacar esta canción de la carpeta?')
    if (!ok) return
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return alert('Debes iniciar sesión')

    const resp = await fetch(`/api/folders/${id}/songs?songId=${songId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      alert('Error removiendo la canción: ' + (err.error || resp.statusText))
      return
    }

    const origIndex = songs.findIndex(s => s.id === songId)
    const newSongs = songs.filter(s => s.id !== songId)
    setSongs(newSongs)
    setCurrentIndex(prev => {
      if (!newSongs.length) return null
      if (prev === null) return null
      if (origIndex === -1) return prev
      if (origIndex < prev) return prev - 1
      if (origIndex === prev) return Math.max(0, prev - 1)
      return prev
    })
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{folderName}</h1>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={goPrevInFolder}
            disabled={currentIndex === null || currentIndex === 0}
            className="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <button
            onClick={goNextInFolder}
            disabled={currentIndex === null || currentIndex >= songs.length - 1}
            className="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Siguiente →
          </button>
          <button
            onClick={openCurrentSong}
            disabled={currentIndex === null}
            className="rounded-full bg-teal-500 text-slate-950 px-3 py-1 disabled:opacity-40"
          >
            Abrir actual
          </button>
        </div>
      </div>

      {/* Agregar canción a la carpeta (buscar en biblioteca) */}
      <div className="rounded-xl border border-slate-800 p-4 space-y-3">
        <p className="font-semibold text-sm">Agregar canción desde la biblioteca</p>
        <div className="flex gap-3">
          <input
            value={libraryQuery}
            onChange={e => setLibraryQuery(e.target.value)}
            placeholder="Buscar en la biblioteca global..."
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs flex-1"
          />
        </div>
        <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80">
          {allSongs
            .filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase()))
            .slice(0, 50)
            .map(a => (
              <div
                key={a.id}
                className="px-3 py-2 flex items-center justify-between border-b border-slate-900/40 last:border-b-0"
              >
                <div>
                  <div className="font-medium">{a.title}</div>
                  {a.author && <div className="text-[11px] text-slate-400">{a.author}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/app/song/${a.id}`)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => addToFolder(a.id)}
                    disabled={songs.some(x => x.id === a.id)}
                    className={
                      'text-[11px] px-2 py-1 rounded ' +
                      (songs.some(x => x.id === a.id)
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-teal-500 hover:bg-teal-400')
                    }
                  >
                    {songs.some(x => x.id === a.id) ? 'En carpeta' : 'Agregar'}
                  </button>
                </div>
              </div>
            ))}
          {libraryQuery && allSongs.filter(a => a.title.toLowerCase().includes(libraryQuery.toLowerCase())).length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">No se encontraron canciones.</div>
          )}
        </div>
      </div>

      {/* Buscador dentro de la carpeta */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3 text-sm">
        <label className="block text-xs text-slate-400 mb-1">Buscar en carpeta</label>
        <input
          type="text"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
          value={songSearch}
          onChange={e => setSongSearch(e.target.value)}
          placeholder="Buscá por título..."
        />
      </div>

      {/* Lista de canciones de la carpeta */}
      <div className="grid gap-3">
        {songs
          .filter(s => s.title.toLowerCase().includes(songSearch.toLowerCase()))
          .map((s) => {
            const origIdx = songs.findIndex(x => x.id === s.id)
            const isActive = origIdx === currentIndex
            return (
          <button
            key={s.id}
              onClick={() => {
                // set index as the original index in songs
                setCurrentIndex(origIdx === -1 ? null : origIdx)
                navigate(`/app/song/${s.id}`)
              }}
            className={
              'text-left rounded-xl border px-3 py-2 hover:border-teal-400 ' +
              (isActive
                ? 'border-teal-400 bg-slate-900/60'
                : 'border-slate-800 bg-slate-950')
            }
          >
              <div className="flex items-center justify-between">
                <div>{s.title}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/app/song/${s.id}`)
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      removeFromFolder(s.id)
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-rose-700/80 hover:bg-rose-600"
                  >
                    Sacar
                  </button>
                </div>
              </div>
          </button>
          )
          })}
        {songs.length === 0 && (
          <p className="text-xs text-slate-400">
            Esta carpeta todavía no tiene canciones. Agregá alguna desde arriba.
          </p>
        )}
      </div>
    </div>
  )
}

export default FolderDetailPage
