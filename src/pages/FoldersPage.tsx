// Importar useMemo
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

// Nuevos tipos / estados
import type { Folder } from '../types'

const FoldersPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [folders, setFolders] = useState<Folder[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  // const [selectedIds, setSelectedIds] = useState<string[]>([])
  // ... resto de estados


  // Cargar carpetas del usuario
  useEffect(() => {
    const loadFolders = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('folders')
        .select('id,name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
      if (error) console.error(error)
      if (data) setFolders(data as Folder[])
    }
    loadFolders()
  }, [user])

  // Crear carpeta
  const handleCreateFolder = async () => {
    if (!user) return alert('Debés iniciar sesión para crear carpetas.')
    if (!newFolderName.trim()) return alert('Ingresá un nombre para la carpeta.')
    setCreating(true)
    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newFolderName.trim(), owner_id: user.id })
      .select('id,name')
      .maybeSingle()

    setCreating(false)
    if (error) {
      console.error(error)
      return alert('No se pudo crear la carpeta: ' + error.message)
    }
    if (data) {
      setFolders(prev => [data as Folder, ...prev])
      setNewFolderName('')
      alert('Carpeta creada correctamente')
      navigate(`/app/folders/${(data as Folder).id}`)
    }
  }


  // const filteredSongs = useMemo(() => [], [songSearch]) // not used in folder page

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-in py-4">
      {/* Header mejorado con gradiente */}
      <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-2 border-purple-400/40 p-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/10 to-pink-500/5 animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-lg animate-pulse" />
            <span className="relative text-4xl">📁</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-1">
              Mis Carpetas
            </h1>
            <p className="text-xs text-slate-300">
              Organizá tus canciones en carpetas personalizadas
            </p>
          </div>
        </div>
      </div>

      {/* Crear nueva carpeta - Card mejorado */}
      <div className="rounded-xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-5 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">➕</span>
          <h2 className="text-sm font-bold text-slate-200">Nueva Carpeta</h2>
        </div>
        <div className="flex gap-3 items-center">
          <input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Nombre de la carpeta (Ej: Domingo 25, Navidad, etc.)"
            className="flex-1 rounded-lg bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-2.5 text-sm outline-none transition-all"
          />
          <button
            onClick={handleCreateFolder}
            disabled={creating || !newFolderName.trim()}
            className="rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 px-6 py-2.5 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center gap-2"
          >
            {creating ? (
              <>
                <span className="animate-spin">⚙️</span>
                Creando...
              </>
            ) : (
              <>
                <span>✨</span>
                Crear
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de carpetas */}
      <div className="rounded-xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-4 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📂</span>
          <h2 className="text-sm font-bold text-slate-200">Tus Carpetas</h2>
          {folders.length > 0 && (
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-200">
              {folders.length} carpeta{folders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-5xl">📂</span>
            <p className="text-sm text-slate-300 font-medium">
              No tenés carpetas creadas
            </p>
            <p className="text-xs text-slate-400">
              Creá tu primera carpeta para organizar canciones
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {folders.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => navigate(`/app/folders/${f.id}`)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="group text-left rounded-lg px-4 py-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/50 transition-all hover:scale-[1.02] animate-[fadeIn_300ms_ease]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-slate-700 group-hover:border-purple-500/50 flex items-center justify-center text-2xl transition-all">
                      📁
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-purple-200 transition-colors">
                      {f.name}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <span>📄</span>
                      Haz clic para ver contenido
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-purple-400 transition-colors">
                    <span className="text-xl">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoldersPage