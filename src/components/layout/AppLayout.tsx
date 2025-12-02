import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.pathname === '/app') return
    navigate(-1)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    'text-xs md:text-sm px-2 md:px-3 py-1 rounded-full border ' +
    (isActive
      ? 'border-teal-400 bg-teal-500/10 text-teal-200'
      : 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-900/60')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden mobile-content-wrapper">
      {/* Fondo musical con overlay y gradientes suaves */}
      <div className="absolute inset-0 -z-10">
        <img src="/brand/bg-piano.svg" alt="fondo musical" className="w-full h-full object-cover opacity-30"/>
      </div>
      <div className="background-vivid" />

      <div className="relative min-h-screen flex flex-col">
        {/* HEADER - Solo visible en Desktop */}
        <header id="desktop-header" className="desktop-header relative border-b-2 border-purple-500/30 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 backdrop-blur-xl shadow-xl shadow-purple-500/10 overflow-hidden">
          {/* Efectos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
          
          <div className="relative flex items-center justify-between px-2 sm:px-4 md:px-8 py-2 sm:py-3 fade-in">
            <div className="flex items-center gap-1 sm:gap-3">
              {location.pathname !== '/app' && (
                <button
                  onClick={handleBack}
                  className="group relative px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-[10px] sm:text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span className="hidden sm:inline">Volver</span>
                </button>
              )}
              
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Logo simple - corchea */}
                <div className="relative w-7 h-7 sm:w-10 sm:h-10 group/logo">
                  <img 
                    src="/brand/note.svg" 
                    alt="HolySong" 
                    className="w-full h-full text-purple-400 group-hover/logo:scale-110 transition-transform duration-300 filter brightness-0 invert" 
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="text-sm sm:text-base font-black bg-gradient-to-r from-purple-300 via-pink-300 to-teal-300 bg-clip-text text-transparent tracking-tight leading-none">
                      HolySong
                    </p>
                    <span className="px-1 sm:px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[7px] sm:text-[8px] font-bold text-purple-300 animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <p className="hidden sm:block text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                    Letras & Acordes en Vivo
                  </p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/app" end className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                🏠 Inicio
              </NavLink>
              <NavLink to="/app/import" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                📥 Importar
              </NavLink>
              <NavLink to="/app/library" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                📚 Biblioteca
              </NavLink>
              <NavLink to="/app/folders" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                📁 Carpetas
              </NavLink>
              <NavLink to="/app/live" className={({ isActive }) =>
                'relative px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ' +
                (isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-2 border-teal-400/60 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800')
              }>
                🎸 Sesión en vivo
              </NavLink>
            </nav>

            <div className="flex items-center gap-1 sm:gap-3">
              {/* Card de usuario */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border-2 border-slate-700 backdrop-blur-sm">
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-teal-600/30 border-2 border-purple-400/60 flex items-center justify-center">
                  <span className="text-sm">👤</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse" />
                </div>
                {user && (
                  <span className="text-xs font-semibold text-slate-200 hidden lg:inline">
                    {user.email?.split('@')[0]}
                  </span>
                )}
              </div>
              
              {/* Botón cerrar sesión */}
              {user && (
                <button
                  onClick={signOut}
                  className="group/btn relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all hover:scale-110 active:scale-95 border border-red-400/50 shadow-lg shadow-red-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                  <span className="relative flex items-center gap-1">
                    <span className="text-sm group-hover/btn:rotate-12 transition-transform">🚪</span>
                    <span className="hidden sm:inline">Cerrar</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE HEADER - Solo nombre de app, email y salir (más prolijo) */}
        <header id="mobile-header" className="mobile-header sticky top-0 z-40 border-b-2 border-purple-500/30 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 backdrop-blur-xl shadow-xl shadow-purple-500/10">
          <div className="relative flex items-start px-2 pr-12 py-3">
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <img src="/brand/note.svg" alt="HolySong" className="w-6 h-6 filter brightness-0 invert" />
                <p className="text-base leading-tight font-black bg-gradient-to-r from-purple-300 via-pink-300 to-teal-300 bg-clip-text text-transparent">
                  HolySong
                </p>
              </div>
              {user && (
                <p className="text-[11px] leading-tight text-slate-300 truncate max-w-[240px]">
                  {user.email}
                </p>
              )}
            </div>
            {user && (
              <button
                onClick={signOut}
                className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-[12px] font-bold border border-red-400/50 shadow-md shadow-red-500/20"
                style={{ right: 'env(safe-area-inset-right)' }}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                🚪
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4 md:px-8 py-4 pb-28 md:pb-6 md:py-6 fade-in">
          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION - Solo visible en móvil */}
        <nav id="bottom-nav" className="bottom-nav-mobile fixed bottom-0 left-0 right-0 z-50 border-t-4 border-teal-500/60 bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 backdrop-blur-xl shadow-[0_-8px_30px_rgba(20,184,166,0.4)]">
          <div className="flex justify-around items-center px-1 py-3">
            <NavLink to="/app" end className={({ isActive }) =>
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[64px] ' +
              (isActive
                ? 'bg-gradient-to-br from-teal-600/40 to-teal-700/30 text-teal-200 shadow-lg shadow-teal-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="text-3xl">🏠</span>
              <span className="text-[9px] font-bold">Inicio</span>
            </NavLink>
            
            <NavLink to="/app/import" className={({ isActive }) =>
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[64px] ' +
              (isActive
                ? 'bg-gradient-to-br from-purple-600/40 to-purple-700/30 text-purple-200 shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="text-3xl">📥</span>
              <span className="text-[9px] font-bold">Importar</span>
            </NavLink>
            
            <NavLink to="/app/library" className={({ isActive }) =>
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[64px] ' +
              (isActive
                ? 'bg-gradient-to-br from-teal-600/40 to-teal-700/30 text-teal-200 shadow-lg shadow-teal-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="text-3xl">📚</span>
              <span className="text-[9px] font-bold">Biblioteca</span>
            </NavLink>
            
            <NavLink to="/app/folders" className={({ isActive }) =>
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[64px] ' +
              (isActive
                ? 'bg-gradient-to-br from-pink-600/40 to-pink-700/30 text-pink-200 shadow-lg shadow-pink-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="text-3xl">📁</span>
              <span className="text-[9px] font-bold">Carpetas</span>
            </NavLink>
            
            <NavLink to="/app/live" className={({ isActive }) =>
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[64px] ' +
              (isActive
                ? 'bg-gradient-to-br from-purple-600/40 to-purple-700/30 text-purple-200 shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="text-3xl">🎸</span>
              <span className="text-[9px] font-bold">Live</span>
            </NavLink>
          </div>
        </nav>

        <footer id="desktop-footer" className="desktop-footer border-t border-slate-900 bg-slate-950/80 text-[11px] text-slate-500 py-2 px-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <span>Autor: Prokopczuk, Axel</span>
            <span>HolySong © {new Date().getFullYear()}</span>
            <span>v1.2.0-mobile</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
