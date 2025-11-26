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
  const [songSearch, setSongSearch] = useState('')
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ... todo el contenido existente ... */}

      {/* Buscador de canción PARA AGREGAR A LA CARPETA -> solo input, sin resultados */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Agregar canción a la carpeta</p>
        <input
          type="text"
          value={songSearch}
          onChange={e => setSongSearch(e.target.value)}
          placeholder="Escribí el título o parte de la letra..."
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
        />
        {/* Se muestran resultados en la vista detallada; aquí solo aparece el input de búsqueda */}
      </div>

      {/* Lista de carpetas mínimas (para evitar variables sin usar) */}
      <div className="mt-4 rounded-xl border border-slate-800 p-3 bg-slate-950/70 space-y-2">
        {/* Crear nueva carpeta */}
        <div className="flex gap-2 items-center">
          <input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Nuevo nombre de carpeta"
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
          />
          <button
            onClick={handleCreateFolder}
            disabled={creating}
            className="rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-2 text-xs font-semibold"
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </div>
        <p className="text-xs font-semibold">Carpetas</p>
        {folders.length === 0 ? (
          <p className="text-[11px] text-slate-500">No tenés carpetas creadas.</p>
        ) : (
          <div className="grid gap-2">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => navigate(`/app/folders/${f.id}`)}
                className="text-left rounded-lg px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px]"
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoldersPage