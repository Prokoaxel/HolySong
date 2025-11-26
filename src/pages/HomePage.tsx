import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type SongResult = {
  id: string
  title: string
  tone: string | null
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SongResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const { data, error } = await supabase
      .from('songs')
      .select('id,title,tone')
      .ilike('title', `%${search}%`)

    setSearching(false)

    if (error) {
      console.error(error)
      alert('Error buscando canciones: ' + error.message)
      return
    }
    setResults(data || [])
  }

  const openSong = (id: string) => {
    navigate(`/app/song/${id}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-[1px]">
        <div className="relative rounded-[22px] bg-slate-950/95 overflow-hidden">
          {/* “ondas” estilo ecualizador dentro del hero */}
          <div className="absolute inset-y-0 left-0 right-0 opacity-50 pointer-events-none">
            <div
              className="absolute -left-10 top-1/4 h-32 w-[140%] blur-3xl"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(34,211,238,0.4), rgba(129,140,248,0.5), rgba(244,114,182,0.4))',
              }}
            />
            <div
              className="absolute -left-10 bottom-0 h-24 w-[140%] blur-3xl"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(16,185,129,0.4), rgba(52,211,153,0.5), rgba(56,189,248,0.4))',
              }}
            />
          </div>

          <div className="relative px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-6">
            {/* floating notes */}
            <div className="floating-note small" style={{ left: 56, top: 28 }}>♪</div>
            <div className="floating-note" style={{ left: '50%', top: 12, animationDelay: '1.5s' }}>♫</div>
            <div className="floating-note big" style={{ right: 56, top: 44, animationDelay: '0.7s' }}>♪</div>
            <div className="flex-1 space-y-3">
              <p className="text-[11px] tracking-[0.25em] text-teal-300 uppercase">
                HOLYSONG • PARA MÚSICOS
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold">
                Tu centro de control para acordes, letras y sesiones en vivo.
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Buscá canciones, armá carpetas por servicio y sincronizá al equipo en
                tiempo real con una sesión compartida.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE BUSCADOR + TARJETAS envuelto en un marco */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/85 p-4 md:p-5 space-y-5">
        {/* BUSCADOR PRINCIPAL */}
        <div className="space-y-3">
          <p className="text-xs text-slate-300 mb-1">
            Buscar canción en toda la biblioteca
          </p>
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder="Escribí el título de la canción..."
              className="flex-1 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs outline-none focus:border-teal-400"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 text-xs font-semibold disabled:opacity-60"
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-2 max-h-40 overflow-auto space-y-1">
              {results.map(song => (
                <button
                  key={song.id}
                  onClick={() => openSong(song.id)}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-400 flex justify-between items-center"
                >
                  <span>{song.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {song.tone ? `Tono: ${song.tone}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {search && !searching && results.length === 0 && (
            <p className="text-[11px] text-slate-500 mt-1">
              No se encontraron canciones con ese título.
            </p>
          )}
        </div>

        {/* TARJETAS PRINCIPALES CON “IMÁGENES” */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Importar */}
          <button
            onClick={() => navigate('/app/import')}
            className="group rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-left hover:border-teal-400 hover:bg-slate-900/90 transition card-tilt"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <img src="/src/assets/card-import.svg" alt="import" className="w-8 h-8"/>
              </div>
              <p className="text-sm font-semibold">Importar canción</p>
            </div>
            <p className="text-xs text-slate-400">
              Subí un PDF o imagen, aplicá OCR y editá la letra con acordes y tono.
            </p>
            <p className="mt-3 text-[11px] text-teal-300 group-hover:underline">
              Abrir →
            </p>
          </button>

          {/* Biblioteca */}
          <button
            onClick={() => navigate('/app/library')}
            className="group rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-left hover:border-teal-400 hover:bg-slate-900/90 transition card-tilt"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-400 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <img src="/src/assets/card-library.svg" className="w-7 h-7" alt="library"/>
              </div>
              <p className="text-sm font-semibold">Biblioteca</p>
            </div>
            <p className="text-xs text-slate-400">
              Explorá todas las canciones globales y filtrá por título o tono.
            </p>
            <p className="mt-3 text-[11px] text-teal-300 group-hover:underline">
              Abrir →
            </p>
          </button>

          {/* Carpetas */}
          <button
            onClick={() => navigate('/app/folders')}
            className="group rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-left hover:border-teal-400 hover:bg-slate-900/90 transition card-tilt"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center shadow-lg shadow-amber-400/30">
                <img src="/src/assets/card-folders.svg" className="w-8 h-8" alt="folders"/>
              </div>
              <p className="text-sm font-semibold">Carpetas</p>
            </div>
            <p className="text-xs text-slate-400">
              Armá sets privados por servicio: sábado, vigilia, eventos, etc.
            </p>
            <p className="mt-3 text-[11px] text-teal-300 group-hover:underline">
              Abrir →
            </p>
          </button>

          {/* Sesión en vivo */}
          <button
            onClick={() => navigate('/app/live')}
            className="group rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-left hover:border-teal-400 hover:bg-slate-900/90 transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <span className="text-slate-950 text-xl">📡</span>
              </div>
              <p className="text-sm font-semibold">Sesión en vivo</p>
            </div>
            <p className="text-xs text-slate-400">
              Creá una sala y sincronizá tono y letra con todos los oyentes.
            </p>
            <p className="mt-3 text-[11px] text-teal-300 group-hover:underline">
              Abrir →
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
