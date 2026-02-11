import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { readCachedSongList } from '../lib/offlineSongs'
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

  useEffect(() => {
    const term = search.trim()
    if (!term) {
      setResults([])
      setSearching(false)
      return
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true)
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,tone')
        .ilike('title', `%${term}%`)
        .limit(20)
      setSearching(false)

      if (error) {
        console.error(error)
        const fallback = readCachedSongList().filter(song =>
          (song.title || '').toLowerCase().includes(term.toLowerCase()),
        )
        setResults(fallback.map(s => ({ id: s.id, title: s.title, tone: s.tone ?? null })))
        alert('Sin conexion: buscando en canciones guardadas localmente.')
        return
      }
      setResults(data || [])
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [search])

  const openSong = (id: string) => navigate(`/app/song/${id}`)

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="rounded-xl md:rounded-3xl border-2 border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-4 md:p-8 space-y-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-teal-300 to-purple-300 bg-clip-text text-transparent">
              Buscar cancion en toda la biblioteca
            </h2>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">
              Resultado automatico mientras escribis
            </p>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Escribi el titulo de la cancion..."
            className="w-full rounded-xl bg-slate-900/80 border-2 border-slate-700 focus:border-purple-500/50 px-4 py-3 text-base md:text-sm outline-none transition-all placeholder:text-slate-500"
          />

          {searching && (
            <div className="space-y-2 p-2 rounded-xl bg-slate-950/60">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-12 rounded-xl border border-slate-800 bg-slate-900/70 animate-pulse" />
              ))}
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="max-h-60 overflow-auto space-y-2 p-2 rounded-xl bg-slate-950/60">
              <p className="text-xs font-bold text-purple-300 px-2">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </p>
              {results.map(song => (
                <button
                  key={song.id}
                  onClick={() => openSong(song.id)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500/50 transition-all shadow-lg flex justify-between items-center"
                >
                  <span className="text-sm font-semibold text-slate-200">{song.title}</span>
                  {song.tone && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                      {song.tone}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!searching && search.trim() && results.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-900/60 border-2 border-slate-800 text-center">
              <p className="text-sm text-slate-400">No se encontraron canciones con ese titulo.</p>
            </div>
          )}
        </div>

        <VerseBanner />
      </div>
    </div>
  )
}

export default HomePage
