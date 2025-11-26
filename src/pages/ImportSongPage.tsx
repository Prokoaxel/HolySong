import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useSearchParams } from 'react-router-dom'

type FormState = {
  title: string
  author: string
  composer: string
  tone: string
  content: string
}

const ImportSongPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Si vienen en la URL, es modo edición
  const songIdParam = searchParams.get('songId')
  const versionIdParam = searchParams.get('versionId')

  const [editingSongId, setEditingSongId] = useState<string | null>(
    songIdParam,
  )
  const [editingVersionId, setEditingVersionId] = useState<string | null>(
    versionIdParam,
  )

  const isEditingSong = !!editingSongId && !editingVersionId
  const isEditingVersion = !!editingVersionId
  const isEditing = isEditingSong || isEditingVersion

  const [form, setForm] = useState<FormState>({
    title: '',
    author: '',
    composer: '',
    tone: '',
    content: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)

  // Cargar datos si estamos editando canción o versión
  useEffect(() => {
    const loadData = async () => {
      if (!songIdParam && !versionIdParam) return

      try {
        setLoadingInitial(true)

        if (versionIdParam) {
          // Editar UNA versión concreta
          const { data: version, error: vError } = await supabase
            .from('song_versions')
            .select('*')
            .eq('id', versionIdParam)
            .maybeSingle()

          if (vError || !version) {
            alert(
              'No se pudo cargar la versión seleccionada: ' +
                (vError?.message ?? ''),
            )
            return
          }

          // Traemos también la canción base para título/autor/etc.
          const { data: song, error: sError } = await supabase
            .from('songs')
            .select('*')
            .eq('id', version.song_id)
            .maybeSingle()

          if (sError || !song) {
            alert(
              'No se pudo cargar la canción base: ' +
                (sError?.message ?? ''),
            )
            return
          }

          setEditingSongId(version.song_id)

          setForm({
            title: song.title ?? '',
            author: song.author ?? '',
            composer: song.composer ?? '',
            tone: version.tone ?? song.tone ?? '',
            content: version.content ?? '',
          })
        } else if (songIdParam) {
          // Editar la canción principal
          const { data: song, error } = await supabase
            .from('songs')
            .select('*')
            .eq('id', songIdParam)
            .maybeSingle()

          if (error || !song) {
            alert(
              'No se pudo cargar la canción: ' +
                (error?.message ?? ''),
            )
            return
          }

          setEditingSongId(song.id)

          setForm({
            title: song.title ?? '',
            author: song.author ?? '',
            composer: song.composer ?? '',
            tone: song.tone ?? '',
            content: song.content ?? '',
          })
        }
      } finally {
        setLoadingInitial(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songIdParam, versionIdParam])

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm(prev => ({ ...prev, [field]: value }))
    }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setOcrText('')
  }

  const handleRunOcr = async () => {
    if (!file) {
      alert('Subí primero un PDF o imagen.')
      return
    }
    try {
      setOcrLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      // TODO: reemplazar /api/ocr por tu endpoint real (Edge Function / backend)
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Error en el servidor OCR')
      }

      const data = await res.json()
      setOcrText(data.text || '')
    } catch (err: any) {
      console.error(err)
      alert('Error ejecutando OCR: ' + err.message)
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    if (!form.title.trim()) {
      alert('Poné un título para la canción.')
      return
    }

    setSaving(true)

    try {
      // Si hay tono, lo agregamos al principio del contenido como "Tono: X"
      let contentWithTone = form.content
      if (form.tone && !/^Tono:/i.test(form.content.trim())) {
        contentWithTone = `Tono: ${form.tone}\n\n${form.content}`
      }

      if (isEditingVersion && editingVersionId && editingSongId) {
        // ACTUALIZAR VERSIÓN EXISTENTE
        const { error } = await supabase
          .from('song_versions')
          .update({
            tone: form.tone,
            content: contentWithTone,
          })
          .eq('id', editingVersionId)

        if (error) throw error

        alert('Versión actualizada correctamente.')
        navigate(`/app/song/${editingSongId}`)
        return
      }

      if (isEditingSong && editingSongId) {
        // ACTUALIZAR CANCIÓN PRINCIPAL
        const { error } = await supabase
          .from('songs')
          .update({
            title: form.title,
            author: form.author,
            composer: form.composer,
            tone: form.tone,
            content: contentWithTone,
          })
          .eq('id', editingSongId)

        if (error) throw error

        alert('Canción actualizada correctamente.')
        navigate(`/app/song/${editingSongId}`)
        return
      }

      // CREAR CANCIÓN NUEVA (comportamiento original)
      const { data, error } = await supabase
        .from('songs')
        .insert({
          owner_id: user.id,
          title: form.title,
          author: form.author,
          composer: form.composer,
          tone: form.tone,
          content: contentWithTone,
        })
        .select()

      if (error || !data || !data[0]) {
        throw error ?? new Error('No se recibió respuesta al guardar.')
      }

      alert('Canción guardada correctamente')
      setForm({
        title: '',
        author: '',
        composer: '',
        tone: '',
        content: '',
      })
      setFile(null)
      setOcrText('')
      navigate('/app')
    } catch (err: any) {
      console.error(err)
      alert('Error guardando: ' + (err?.message ?? ''))
    } finally {
      setSaving(false)
    }
  }

  const headerTitle = isEditingVersion
    ? 'Editar versión'
    : isEditingSong
    ? 'Editar canción'
    : 'Importar canción'

  const headerSubtitle = isEditingVersion
    ? 'Modificá la letra y el tono de esta versión. El título/autor pertenecen a la canción base.'
    : isEditingSong
    ? 'Editá los datos de la canción original.'
    : 'Subí un PDF o imagen (para OCR) o pegá directamente la letra con acordes. Completá título, autor y tono.'

  const saveButtonLabel = isEditing
    ? saving
      ? 'Guardando cambios...'
      : 'Guardar cambios'
    : saving
    ? 'Guardando...'
    : 'Guardar canción'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">{headerTitle}</h1>
        <p className="text-xs text-slate-400">{headerSubtitle}</p>
      </div>

      {loadingInitial ? (
        <p className="text-xs text-slate-400">Cargando datos...</p>
      ) : (
        <>
          {/* archivo + OCR */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 text-sm">
            <p className="font-semibold text-xs">Archivo (opcional)</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="text-xs"
            />
            {file && (
              <p className="text-[11px] text-slate-400">
                Archivo seleccionado: {file.name}
              </p>
            )}

            <button
              onClick={handleRunOcr}
              disabled={!file || ocrLoading}
              className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-[11px] disabled:opacity-60"
            >
              {ocrLoading ? 'Reconociendo...' : 'Reconocer texto (OCR)'}
            </button>

            {ocrText && (
              <div className="mt-3 space-y-1">
                <p className="text-[11px] font-semibold">
                  Resultado de OCR
                </p>
                <textarea
                  value={ocrText}
                  onChange={e => setOcrText(e.target.value)}
                  className="w-full h-32 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                />
                <button
                  onClick={() =>
                    setForm(prev => ({
                      ...prev,
                      content: prev.content
                        ? prev.content + '\n\n' + ocrText
                        : ocrText,
                    }))
                  }
                  className="mt-1 rounded-lg bg-slate-800 px-3 py-1 text-[11px]"
                >
                  Usar texto OCR en la letra
                </button>
              </div>
            )}
          </div>

          {/* formulario principal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">Título</label>
                <input
                  value={form.title}
                  onChange={handleChange('title')}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                  placeholder="Ej: Toma tu lugar"
                  disabled={isEditingVersion} // en versión normalmente no cambia
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Autor</label>
                <input
                  value={form.author}
                  onChange={handleChange('author')}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                  placeholder="Opcional"
                  disabled={isEditingVersion}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Compositor</label>
                <input
                  value={form.composer}
                  onChange={handleChange('composer')}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                  placeholder="Opcional"
                  disabled={isEditingVersion}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Tono</label>
                <input
                  value={form.tone}
                  onChange={handleChange('tone')}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                  placeholder="Ej: D, Em, F#..."
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Este tono se agregará al principio como &quot;Tono:
                  X&quot; y se usará para transponer.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">
                Letra con acordes
              </label>
              <textarea
                value={form.content}
                onChange={handleChange('content')}
                className="w-full h-64 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono"
                placeholder="Pegá aquí la letra con los acordes (Em, Bm, C#, etc.)"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-teal-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
              >
                {saveButtonLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ImportSongPage
