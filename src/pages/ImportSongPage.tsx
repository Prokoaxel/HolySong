import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createWorker } from 'tesseract.js'

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
      
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp']
      if (!validTypes.includes(file.type)) {
        alert('⚠️ Por favor subí una imagen (JPG, PNG, GIF, BMP).\n\nLos archivos PDF no están soportados actualmente.')
        return
      }

      // Crear worker de Tesseract
      const worker = await createWorker('spa', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progreso: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      // Reconocer texto
      const { data } = await worker.recognize(file)
      await worker.terminate()

      const extractedText = data.text.trim()
      
      if (!extractedText) {
        alert('⚠️ No se pudo extraer texto de la imagen.\n\nAsegurate que:\n• La imagen tenga texto legible\n• El texto no esté borroso\n• Haya buen contraste')
        return
      }

      setOcrText(extractedText)
      alert('✅ Texto extraído correctamente!\n\nRevisá el resultado y luego hacé clic en "Usar texto OCR en la letra"')
      
    } catch (err: any) {
      console.error('OCR Error:', err)
      alert('❌ Error ejecutando OCR: ' + err.message + '\n\nIntentá con otra imagen o pegá el texto manualmente.')
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
    <div className="max-w-5xl mx-auto space-y-4 fade-in py-4">
      {/* Header mejorado con gradiente y animación */}
      <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/40 p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md animate-pulse" />
            <span className="relative text-3xl">{isEditing ? '✏️' : '📥'}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-1">{headerTitle}</h1>
            <p className="text-xs text-slate-300 leading-relaxed">{headerSubtitle}</p>
          </div>
        </div>
      </div>

      {loadingInitial ? (
        <p className="text-xs text-slate-400">Cargando datos...</p>
      ) : (
        <>
          {/* archivo + OCR */}
          <div className="rounded-2xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-6 space-y-4 text-sm transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <p className="font-bold text-sm text-slate-200">Archivo (opcional)</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-200">Solo imágenes</span>
            </div>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.gif,.bmp"
                onChange={handleFileChange}
                className="w-full text-xs bg-slate-900/80 border-2 border-slate-700 rounded-lg px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-500 hover:file:to-pink-500 file:cursor-pointer transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span>💡</span>
                Subí una captura o foto de la letra. PDF no soportado por el momento.
              </p>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-400/30 rounded-lg px-3 py-2 animate-[fadeIn_200ms_ease]">
                <span className="text-sm">✅</span>
                <p className="text-[11px] text-teal-200 font-medium">
                  {file.name}
                </p>
              </div>
            )}

            <button
              onClick={handleRunOcr}
              disabled={!file || ocrLoading}
              className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-700 px-5 py-3 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
            >
              {ocrLoading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Reconociendo texto...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Reconocer texto (OCR)
                </>
              )}
            </button>

            {ocrText && (
              <div className="mt-4 space-y-3 bg-gradient-to-br from-teal-900/20 to-purple-900/20 border-2 border-teal-400/40 rounded-xl p-4 animate-[fadeIn_300ms_ease]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <p className="text-sm font-bold text-teal-200">
                    Resultado de OCR
                  </p>
                </div>
                <textarea
                  value={ocrText}
                  onChange={e => setOcrText(e.target.value)}
                  className="w-full h-32 rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-teal-500/50 px-4 py-3 text-xs font-mono resize-none outline-none transition-all"
                  placeholder="El texto reconocido aparecerá aquí..."
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
                  className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2.5 text-xs font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>📝</span>
                  Usar texto OCR en la letra
                </button>
              </div>
            )}
          </div>

          {/* formulario principal */}
          <div className="rounded-2xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/20 p-6 space-y-5 text-sm transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎵</span>
              <h2 className="font-bold text-base text-slate-200">Datos de la canción</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <span>🎼</span>
                  Título
                </label>
                <input
                  value={form.title}
                  onChange={handleChange('title')}
                  className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  placeholder="Ej: Toma tu lugar"
                  disabled={isEditingVersion}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <span>👤</span>
                  Autor
                </label>
                <input
                  value={form.author}
                  onChange={handleChange('author')}
                  className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  placeholder="Opcional"
                  disabled={isEditingVersion}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <span>✍️</span>
                  Compositor
                </label>
                <input
                  value={form.composer}
                  onChange={handleChange('composer')}
                  className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  placeholder="Opcional"
                  disabled={isEditingVersion}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                  <span>🎹</span>
                  Tono
                </label>
                <input
                  value={form.tone}
                  onChange={handleChange('tone')}
                  className="w-full rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-orange-500/50 px-4 py-2.5 text-sm font-bold outline-none transition-all"
                  placeholder="Ej: D, Em, F#..."
                />
                <div className="flex items-start gap-1 mt-2">
                  <span className="text-[10px]">💡</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Este tono se agregará al principio como &quot;Tono: X&quot; y se usará para transponer.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                <span>📝</span>
                Letra con acordes
              </label>
              <textarea
                value={form.content}
                onChange={handleChange('content')}
                className="w-full h-64 rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-3 text-sm font-mono resize-none outline-none transition-all"
                placeholder="Pegá aquí la letra con los acordes (Em, Bm, C#, etc.)"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 px-8 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    {saveButtonLabel}
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    {saveButtonLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ImportSongPage
