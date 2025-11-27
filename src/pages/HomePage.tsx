import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import VerseBanner from '../components/ui/VerseBanner'

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HERO con gradiente y animaciones */}
      <div className="relative rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8 md:p-12 overflow-hidden shadow-2xl shadow-purple-500/10">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
        
        {/* Fondo de instrumentos */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "url('/brand/home-hero-instrument.svg')",
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
          }}
        />
        
        {/* Partículas decorativas */}
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-purple-400 animate-ping opacity-60" />
        <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-teal-400 animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-pink-400 animate-ping opacity-60" style={{ animationDelay: '1s' }} />
        
        <div className="space-y-4 fade-in relative z-10">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 animate-pulse">
              <p className="text-[10px] tracking-[0.25em] text-purple-300 uppercase font-bold">HOLYSONG • PARA MÚSICOS</p>
            </div>
            <span className="text-2xl animate-bounce-slow">🎵</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-200 via-pink-200 to-teal-200 bg-clip-text text-transparent leading-tight">
            Tu control para acordes, letras y sesiones en vivo
          </h1>
          
          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            🎸 Buscá canciones • 📁 Armá carpetas por servicio • 🎚️ Sincronizá al equipo en tiempo real con una sesión compartida
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/app/library')}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-sm font-bold transition-all hover:scale-105 active:scale-95 border-2 border-purple-400/60 shadow-lg shadow-purple-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                <span>📚</span>
                Explorar Biblioteca
              </span>
            </button>
            
            <button
              onClick={() => navigate('/app/live')}
              className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border-2 border-teal-500/50 hover:border-teal-400 text-sm font-bold transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <span>🎸</span>
              Crear Sesión en Vivo
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE BUSCADOR + TARJETAS */}
      <div className="rounded-3xl border-2 border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-6 md:p-8 space-y-6 shadow-xl">
        {/* BUSCADOR PRINCIPAL */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-teal-300 to-purple-300 bg-clip-text text-transparent">
                Buscar canción en toda la biblioteca
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Encuentra cualquier canción por título
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder="🎵 Escribí el título de la canción..."
              className="flex-1 rounded-xl bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-5 py-3 text-sm outline-none transition-all placeholder:text-slate-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-6 py-3 text-sm font-bold disabled:opacity-60 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30 border-2 border-teal-400/60"
            >
              {searching ? '⏳ Buscando...' : '🔎 Buscar'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-3 max-h-60 overflow-auto space-y-2 p-2 rounded-xl bg-slate-950/60">
              <p className="text-xs font-bold text-purple-300 mb-2 px-2">
                ✨ {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((song, idx) => (
                <button
                  key={song.id}
                  onClick={() => openSong(song.id)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500/50 transition-all hover:scale-[1.02] shadow-lg flex justify-between items-center animate-[fadeIn_300ms_ease]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎵</span>
                    <span className="text-sm font-semibold text-slate-200">{song.title}</span>
                  </div>
                  {song.tone && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                      {song.tone}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {search && !searching && results.length === 0 && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border-2 border-slate-800 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-slate-400 mt-2">
                No se encontraron canciones con ese título
              </p>
            </div>
          )}
        </div>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Importar */}
          <button
            onClick={() => navigate('/app/import')}
            className="group relative rounded-2xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                  📥
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">Importar</p>
                  <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">Subir canción</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Subí un PDF o imagen, aplicá OCR y editá la letra con acordes y tono.
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-400 font-bold group-hover:gap-3 transition-all">
                Abrir <span>→</span>
              </div>
            </div>
          </button>

          {/* Biblioteca */}
          <button
            onClick={() => navigate('/app/library')}
            className="group relative rounded-2xl border-2 border-slate-700 hover:border-teal-500/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-all hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600/20 to-teal-700/20 border-2 border-teal-500/40 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                  📚
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">Biblioteca</p>
                  <p className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider">Explorar todo</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Explorá todas las canciones globales y filtrá por título o tono.
              </p>
              <div className="flex items-center gap-2 text-sm text-teal-400 font-bold group-hover:gap-3 transition-all">
                Abrir <span>→</span>
              </div>
            </div>
          </button>

          {/* Carpetas */}
          <button
            onClick={() => navigate('/app/folders')}
            className="group relative rounded-2xl border-2 border-slate-700 hover:border-pink-500/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-all hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-600/20 to-pink-700/20 border-2 border-pink-500/40 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                  📁
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">Carpetas</p>
                  <p className="text-[10px] text-pink-300 font-semibold uppercase tracking-wider">Organizar sets</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Armá sets privados por servicio: sábado, vigilia, eventos, etc.
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-400 font-bold group-hover:gap-3 transition-all">
                Abrir <span>→</span>
              </div>
            </div>
          </button>

          {/* Sesión en vivo */}
          <button
            onClick={() => navigate('/app/live')}
            className="group relative rounded-2xl border-2 border-slate-700 hover:border-purple-500/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-2 border-purple-500/40 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                  🎸
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">Sesión en vivo</p>
                  <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">Sincronizar</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Creá una sala y sincronizá tono y letra con todos los oyentes.
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-400 font-bold group-hover:gap-3 transition-all">
                Abrir <span>→</span>
              </div>
            </div>
          </button>
        </div>
        {/* Versículo bajo el menú principal */}
        <VerseBanner />
      </div>
    </div>
  )
}

export default HomePage
