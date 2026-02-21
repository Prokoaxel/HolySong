import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const DesktopAppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.pathname === '/app') return
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src="/brand/bg-piano.svg" alt="fondo musical" className="w-full h-full object-cover opacity-30" />
      </div>
      <div className="background-vivid" />

      <div className="relative min-h-screen flex flex-col">
        <header className="relative border-b border-purple-500/25 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 backdrop-blur-xl shadow-md shadow-purple-500/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

          <div className="relative flex items-center justify-between px-8 py-3 fade-in">
            <div className="flex items-center gap-3">
              {location.pathname !== '/app' && (
                <button
                  onClick={handleBack}
                  className="group relative px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">{'<-'}</span>
                  <span>Volver</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-3 text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                aria-label="Volver atras"
                title="Volver"
              >
                <div className="relative w-10 h-10 group/logo">
                  <img
                    src="/brand/note.svg"
                    alt="HolySong"
                    className="w-full h-full text-purple-400 group-hover/logo:scale-110 transition-transform duration-300 filter brightness-0 invert"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black bg-gradient-to-r from-purple-300 via-pink-300 to-teal-300 bg-clip-text text-transparent tracking-tight leading-none">
                      HolySong
                    </p>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[8px] font-bold text-purple-300 animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                    Letras & Acordes en Vivo
                  </p>
                </div>
              </button>
            </div>

            <nav className="flex items-center gap-2">
              <NavLink to="/app" end className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                Inicio
              </NavLink>
              <NavLink to="/app/import" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                Importar
              </NavLink>
              <NavLink to="/app/library" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                Biblioteca
              </NavLink>
              <NavLink to="/app/folders" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                Carpetas
              </NavLink>
              <NavLink to="/app/live" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                Sesion en vivo
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border-2 border-slate-700 backdrop-blur-sm">
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-teal-600/30 border-2 border-purple-400/60 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-200">U</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse" />
                </div>
                {user && (
                  <span className="text-xs font-semibold text-slate-200 hidden lg:inline">
                    {user.email?.split('@')[0]}
                  </span>
                )}
              </div>

              {user && (
                <button
                  onClick={signOut}
                  className="group/btn relative px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-black uppercase tracking-wider transition-all hover:scale-110 active:scale-95 border border-red-400/50 shadow-lg shadow-red-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                  <span className="relative flex items-center gap-1">
                    <span className="text-sm group-hover/btn:rotate-12 transition-transform">[]</span>
                    <span>Cerrar</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden px-8 py-6 fade-in">
          <Outlet />
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 text-[11px] text-slate-500 py-2 px-8">
          <div className="flex items-center justify-between gap-2">
            <span>Autor: Prokopczuk, Axel</span>
            <span>HolySong (c) {new Date().getFullYear()}</span>
            <span>v1.2.0-desktop</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DesktopAppLayout
