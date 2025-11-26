import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import SongViewer from '../components/songs/SongViewer'
import type { DbSong, DbVersion } from '../types'

type Instrument = 'guitar' | 'piano' | 'bass'

/* NOTE: handleDeleteVersion moved inside component so it can access state setters */


const SongPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [savingVersion, setSavingVersion] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [song, setSong] = useState<DbSong | null>(null)
  const [versions, setVersions] = useState<DbVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<'base' | string>('base')
  const [searchText, setSearchText] = useState('')

  // Controls lifted for unified stripe
  const [fontSize, setFontSize] = useState<number>(16)
  const [transposeSteps, setTransposeSteps] = useState<number>(0)
  const [capo, setCapo] = useState<number>(0)
  const [bpm, setBpm] = useState<number>(80)
  const [metronomeOn, setMetronomeOn] = useState<boolean>(false)
  const [autoScrollOn, setAutoScrollOn] = useState<boolean>(false)
  const [scrollSpeed, setScrollSpeed] = useState<number>(1)
  const [instrument, setInstrument] = useState<Instrument>('guitar')

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
          setError('No se pudo cargar la canción.')
          setLoading(false)
          return
        }
        setSong(songData as DbSong)

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

  // =========================
  // Versión seleccionada
  // =========================
  const selectedVersion = useMemo(
    () => versions.find(v => v.id === selectedVersionId),
    [versions, selectedVersionId],
  )

  const currentTitle = song?.title ?? ''
  const currentTone = selectedVersion?.tone ?? song?.tone ?? ''
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
      setVersions(prev => [...prev, newVersion])
      setSelectedVersionId(newVersion.id)
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
  const handleAddToFolder = async () => {
    if (!song) return
    if (!user) {
      alert('Tenés que iniciar sesión para agregar a una carpeta.')
      return
    }

    const folderName = window.prompt(
      'Nombre de la carpeta donde querés agregar la canción:',
      '',
    )
    if (!folderName) return

    const { data: existing, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('owner_id', user.id)
      .eq('name', folderName)
      .maybeSingle()

    if (folderError) {
      console.error(folderError)
      alert('Error buscando carpeta.')
      return
    }

    let folderId = existing?.id as string | undefined

    if (!folderId) {
      const { data: created, error: createError } = await supabase
        .from('folders')
        .insert({
          name: folderName,
          owner_id: user.id,
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error(createError)
        alert('Error creando carpeta.')
        return
      }
      folderId = created.id
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return alert('Debes iniciar sesión')

    const resp = await fetch(`/api/folders/${folderId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ song_id: song.id }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      console.error(err)
      alert('Error agregando canción a la carpeta.')
      return
    }

    alert('Canción agregada a la carpeta correctamente.')
  }

  // =========================
  // Buscar otra canción
  // =========================
  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter' && searchText.trim()) {
      navigate(`/app/library?query=${encodeURIComponent(searchText.trim())}`)
    }
  }

  if (loading && !song) {
    return (
      <div className="px-8 py-10 text-slate-300">
        Cargando canción…
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="px-8 py-10 text-red-300">
        {error ?? 'No se encontró la canción.'}
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT COLUMN - unified stripe */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-3 flex flex-col gap-3 h-[calc(100vh-12rem)] overflow-auto sticky top-16">
            {/* Search */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Buscar</p>
              <input
                type="text"
                className="w-full rounded-md bg-slate-950/80 border border-slate-700 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                placeholder="Buscar título..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            {/* Title + actions */}
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-xs">
              <p className="text-[10px] uppercase tracking-wide text-teal-300 mb-1">Título</p>
              <h1 className="text-base font-semibold text-slate-50 truncate mb-1">{currentTitle}</h1>
              <p className="text-[11px] text-slate-400 truncate">Autor: <span className="text-slate-200">{song.author ?? 'sin autor'}</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Tono: <span className="text-orange-400 font-semibold">{song.tone ?? '-'}</span></p>
              <div className="mt-2 flex gap-2">
                <button onClick={handleEditSong} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs">Editar</button>
                <button onClick={handleCreateVersion} disabled={savingVersion} className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 border border-teal-400 text-xs text-slate-950 font-semibold">{savingVersion ? 'Guardando…' : 'Nueva versión'}</button>
              </div>
            </div>

            {/* Versions */}
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 flex flex-col overflow-hidden">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Versiones</p>
              <button type="button" onClick={() => setSelectedVersionId('base')} className={'w-full text-left rounded-lg px-2 py-1 mb-2 border text-xs ' + (selectedVersionId === 'base' ? 'border-teal-400 bg-teal-500/10 text-teal-100' : 'border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-500')}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Principal</span>
                  <span className="text-[10px] text-slate-400">{song.tone ?? '-'}</span>
                </div>
              </button>
              <div className="flex-1 overflow-auto space-y-2 pr-1">
                {versions.length === 0 && (<p className="text-[11px] text-slate-500">Aún no creaste versiones.</p>)}
                {versions.map(v => (
                  <div key={v.id} onClick={() => setSelectedVersionId(v.id)} role="button" tabIndex={0} className={'w-full text-left rounded-lg px-2 py-1 mb-2 border text-xs ' + (selectedVersionId === v.id ? 'border-teal-400 bg-teal-500/10 text-teal-100' : 'border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-500')}>
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="text-xs font-medium leading-none">{v.version_label}</p>
                        <p className="text-[10px] text-slate-400 leading-none">Tono: {v.tone ?? song?.tone ?? '-'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); handleEditVersion(v.id) }} className="text-[10px] px-2 py-1 rounded bg-slate-800">Editor</button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteVersion(v.id) }} className="text-[10px] px-2 py-1 rounded bg-red-700/80 hover:bg-red-600">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-3 mt-2 text-xs">
              <p className="text-[11px] font-semibold mb-2">Texto</p>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setFontSize(f => Math.max(12, f - 1))} className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">A-</button>
                <button onClick={() => setFontSize(f => Math.min(28, f + 1))} className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">A+</button>
              </div>
              <p className="text-[11px] font-semibold mb-2">Instrumento</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setInstrument('guitar')} className={ 'flex-1 rounded-md px-2 py-1 border text-[11px] ' + (instrument === 'guitar' ? 'border-teal-400 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300') }>Guitarra</button>
                <button onClick={() => setInstrument('piano')} className={ 'flex-1 rounded-md px-2 py-1 border text-[11px] ' + (instrument === 'piano' ? 'border-teal-400 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300') }>Piano</button>
                <button onClick={() => setInstrument('bass')} className={ 'flex-1 rounded-md px-2 py-1 border text-[11px] ' + (instrument === 'bass' ? 'border-teal-400 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300') }>Bajo</button>
              </div>
              <p className="text-[11px] font-semibold mb-2">Tono</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setTransposeSteps(s => Math.max(-12, s - 1))} className="flex-1 rounded bg-slate-800 py-1 text-[11px]">- ½</button>
                <button onClick={() => setTransposeSteps(s => Math.min(12, s + 1))} className="flex-1 rounded bg-slate-800 py-1 text-[11px]">+ ½</button>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px] mb-3">
                {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(n => (
                  <button key={n} onClick={() => setTransposeSteps(computeStepsTo(n))} className="rounded py-1 bg-slate-900 border border-slate-700">{n}</button>
                ))}
              </div>
              <div className="mb-3">
                <p className="text-[11px] text-slate-400 mb-1">Capo</p>
                <input type="range" min={0} max={7} value={capo} onChange={(e)=>setCapo(parseInt(e.target.value))} className="w-full"/>
              </div>
              <div className="mb-3">
                <p className="text-[11px] text-slate-400 mb-1">Metrónomo</p>
                <div className="flex items-center gap-2">
                  <input type="number" min={40} max={220} value={bpm} onChange={e=>setBpm(Math.min(220, Math.max(40, Number(e.target.value)||80)))} className="w-16 rounded bg-slate-900/80 border border-slate-700 px-2 py-1 text-[11px]"/>
                  <button onClick={()=>setMetronomeOn(on=>!on)} className={ 'flex-1 rounded py-1 text-[11px] ' + (metronomeOn ? 'bg-teal-500 text-slate-900' : 'bg-slate-800') }>{metronomeOn ? 'Parar' : 'Iniciar'}</button>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[11px] text-slate-400 mb-1">Autoscroll</p>
                <input type="range" min={0} max={4} value={autoScrollOn ? scrollSpeed : 0} onChange={e=>{ const v = Number(e.target.value); if (v===0) setAutoScrollOn(false); else { setScrollSpeed(v); setAutoScrollOn(true) }}} className="w-full"/>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleAddToFolder} className="w-full rounded bg-slate-800 py-1 text-[11px]">Agregar a carpeta</button>
                <button className="w-full rounded bg-slate-800 py-1 text-[11px]">Descargar PDF</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - lyrics viewer (expanded) */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <SongViewer
            key={`${song.id}-${selectedVersionId}`}
            title={currentTitle}
            tone={currentTone}
            content={currentContent}
            onAddToFolder={handleAddToFolder}
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
      </div>
    </div>
  )
}

export default SongPage
