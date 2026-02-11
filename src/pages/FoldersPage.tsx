import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import type { Folder } from '../types'

const FoldersPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [folders, setFolders] = useState<Folder[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [supportsFolderMeta, setSupportsFolderMeta] = useState(true)
  const EMOJI_OPTIONS = ['📁', '🎵', '🙏', '🎸', '🎹', '🔥', '⭐', '📖', '🎤', '🎼', '🕊️', '💒']

  const FOLDER_META_STORAGE_KEY = 'holysong.folderMeta.v1'
  const readLocalFolderMeta = (): Record<string, { emoji?: string; description?: string }> => {
    try {
      const raw = localStorage.getItem(FOLDER_META_STORAGE_KEY)
      if (!raw) return {}
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  const writeLocalFolderMeta = (meta: Record<string, { emoji?: string; description?: string }>) => {
    try {
      localStorage.setItem(FOLDER_META_STORAGE_KEY, JSON.stringify(meta))
    } catch {
      // noop
    }
  }

  useEffect(() => {
    const loadFolders = async () => {
      if (!user) return
      const fullQuery = await supabase
        .from('folders')
        .select('id,name,emoji,description')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })

      if (!fullQuery.error) {
        setSupportsFolderMeta(true)
        setFolders((fullQuery.data || []) as Folder[])
        return
      }

      const basicQuery = await supabase
        .from('folders')
        .select('id,name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })

      if (basicQuery.error) {
        console.error(basicQuery.error)
        return
      }

      setSupportsFolderMeta(false)
      const localMeta = readLocalFolderMeta()
      const merged = (basicQuery.data || []).map((f: any) => ({
        ...f,
        emoji: localMeta[f.id]?.emoji || null,
        description: localMeta[f.id]?.description || null,
      }))
      setFolders(merged as Folder[])
    }

    loadFolders()
  }, [user])

  const filteredFolders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return folders
    return folders.filter(f =>
      `${f.name || ''} ${f.description || ''}`.toLowerCase().includes(term),
    )
  }, [folders, search])

  const handleCreateFolder = async () => {
    if (!user) return alert('Debes iniciar sesion para crear carpetas.')
    if (!newFolderName.trim()) return alert('Ingresa un nombre para la carpeta.')

    setCreating(true)
    const payloadWithMeta = {
      name: newFolderName.trim(),
      owner_id: user.id,
      emoji: newFolderEmoji.trim() || '📁',
      description: newFolderDescription.trim() || null,
    }

    let data: any = null
    let error: any = null

    if (supportsFolderMeta) {
      const insertWithMeta = await supabase
        .from('folders')
        .insert(payloadWithMeta)
        .select('id,name,emoji,description')
        .maybeSingle()
      data = insertWithMeta.data
      error = insertWithMeta.error
    } else {
      const insertBasic = await supabase
        .from('folders')
        .insert({ name: payloadWithMeta.name, owner_id: payloadWithMeta.owner_id })
        .select('id,name')
        .maybeSingle()
      data = insertBasic.data
      error = insertBasic.error
      if (insertBasic.data) {
        const localMeta = readLocalFolderMeta()
        localMeta[insertBasic.data.id] = {
          emoji: payloadWithMeta.emoji,
          description: payloadWithMeta.description || undefined,
        }
        writeLocalFolderMeta(localMeta)
        data = { ...insertBasic.data, emoji: payloadWithMeta.emoji, description: payloadWithMeta.description }
      }
    }

    setCreating(false)

    if (error) {
      console.error(error)
      return alert('No se pudo crear la carpeta: ' + error.message)
    }

    if (data) {
      const created = data as Folder
      setFolders(prev => [created, ...prev])
      setNewFolderName('')
      setNewFolderEmoji('📁')
      setNewFolderDescription('')
      setEmojiPickerOpen(false)
      setCreateModalOpen(false)
      navigate(`/app/folders/${created.id}`)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto fade-in py-2 sm:py-4">
      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-900/80 p-3 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar carpeta..."
              className="w-full rounded-lg bg-slate-950/80 border border-slate-700 focus:border-purple-500/50 pl-9 pr-3 py-2.5 text-sm outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="min-w-[96px] rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-900/80 p-2 sm:p-3">
        {filteredFolders.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No hay carpetas para mostrar.</div>
        ) : (
          <div className="rounded-lg overflow-hidden border border-slate-800/90 bg-slate-950/30">
            {filteredFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => navigate(`/app/folders/${folder.id}`)}
                className="w-full text-left px-3 sm:px-4 py-3 border-b border-slate-800/70 last:border-b-0 bg-slate-900/35 hover:bg-slate-800/70 transition-colors flex items-center gap-3"
              >
                <span className="h-8 w-8 rounded-md border border-purple-500/40 bg-purple-500/10 text-purple-200 flex items-center justify-center flex-shrink-0 text-base">
                  {folder.emoji?.trim() || '📁'}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-100 truncate">{folder.name}</span>
                  {folder.description && (
                    <span className="block text-[11px] text-slate-400 truncate">{folder.description}</span>
                  )}
                </span>

                <span className="text-slate-500 flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {createModalOpen && createPortal(
        <div className="fixed inset-0 z-[120]">
          <button className="absolute inset-0 bg-black/60" onClick={() => { setCreateModalOpen(false); setEmojiPickerOpen(false) }} aria-label="Cerrar" />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-100">Crear carpeta</p>
              <button
                onClick={() => { setCreateModalOpen(false); setEmojiPickerOpen(false) }}
                className="h-8 w-8 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center text-lg leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5">
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Nombre de la carpeta"
                className="w-full rounded-lg bg-slate-950/80 border border-slate-700 focus:border-purple-500/50 px-3 py-2.5 text-sm outline-none transition-all"
              />

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen(v => !v)}
                  className="w-full rounded-lg bg-slate-950/80 border border-slate-700 hover:border-purple-500/50 px-3 py-2 text-sm text-left flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{newFolderEmoji}</span>
                    <span className="text-slate-200">Icono</span>
                  </span>
                  <span className="text-slate-400 text-xs">{emojiPickerOpen ? 'Ocultar' : 'Elegir'}</span>
                </button>

                {emojiPickerOpen && (
                  <div className="grid grid-cols-6 gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 p-2">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewFolderEmoji(emoji)
                          setEmojiPickerOpen(false)
                        }}
                        className={'h-8 rounded-md border text-base transition-all active:scale-95 ' + (newFolderEmoji === emoji ? 'border-teal-400 bg-teal-500/20' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500')}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={newFolderDescription}
                onChange={e => setNewFolderDescription(e.target.value)}
                placeholder="Descripcion opcional"
                className="w-full rounded-lg bg-slate-950/80 border border-slate-700 focus:border-purple-500/50 px-3 py-2.5 text-sm outline-none transition-all"
              />

              <button
                onClick={handleCreateFolder}
                disabled={creating || !newFolderName.trim()}
                className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      , document.body
      )}
    </div>
  )
}

export default FoldersPage


