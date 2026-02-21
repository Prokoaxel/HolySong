import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const MobileAppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.pathname === '/app') return
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden mobile-content-wrapper">
      <div className="absolute inset-0 -z-10">
        <img src="/brand/bg-piano.svg" alt="fondo musical" className="w-full h-full object-cover opacity-30" />
      </div>
      <div className="background-vivid" />

      <div className="relative min-h-screen flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-[60] border-b border-purple-500/25 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 backdrop-blur-xl shadow-md shadow-purple-500/10">
          <div className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5" style={{ paddingRight: 'calc(0.625rem + env(safe-area-inset-right))' }}>
            <button
              type="button"
              onClick={handleBack}
              className="min-w-0 flex items-center gap-1.5 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400/60"
              aria-label="Volver atras"
              title="Volver"
            >
              <img src="/brand/note.svg" alt="HolySong" className="w-5 h-5 filter brightness-0 invert" />
              <p className="text-[14px] leading-tight font-black bg-gradient-to-r from-purple-300 via-pink-300 to-teal-300 bg-clip-text text-transparent">
                HolySong
              </p>
            </button>
            <div className="min-w-0 flex items-center gap-2 justify-end">
              {user && (
                <p className="text-[10px] leading-tight text-slate-400 truncate max-w-[180px] text-right">
                  {user.email}
                </p>
              )}
              {user && (
                <button
                  onClick={signOut}
                  className="h-6 w-[56px] rounded-md bg-slate-900/85 hover:bg-red-900/50 text-[9px] font-semibold border border-slate-700 hover:border-red-500/60 text-slate-300 hover:text-red-200 transition-all"
                  aria-label="Cerrar sesion"
                  title="Cerrar sesion"
                >
                  Salir
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4 pt-11 pb-28 fade-in">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-teal-500/50 bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 backdrop-blur-xl shadow-[0_-6px_20px_rgba(20,184,166,0.28)]">
          <div className="grid grid-cols-5 items-center gap-1 px-2 py-2 mx-auto w-full max-w-[560px]">
            <NavLink to="/app" end className={({ isActive }) =>
              'flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ' +
              (isActive
                ? 'bg-gradient-to-br from-teal-600/40 to-teal-700/30 text-teal-200 shadow-lg shadow-teal-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                </svg>
              </span>
              <span className="text-[8px] font-bold leading-none">Inicio</span>
            </NavLink>

            <NavLink to="/app/import" className={({ isActive }) =>
              'flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ' +
              (isActive
                ? 'bg-gradient-to-br from-purple-600/40 to-purple-700/30 text-purple-200 shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v11" />
                  <path d="m8 10 4 4 4-4" />
                  <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                </svg>
              </span>
              <span className="text-[8px] font-bold leading-none">Importar</span>
            </NavLink>

            <NavLink to="/app/library" className={({ isActive }) =>
              'flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ' +
              (isActive
                ? 'bg-gradient-to-br from-teal-600/40 to-teal-700/30 text-teal-200 shadow-lg shadow-teal-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5z" />
                  <path d="M8 7h8" />
                  <path d="M8 11h8" />
                </svg>
              </span>
              <span className="text-[8px] font-bold leading-none">Biblioteca</span>
            </NavLink>

            <NavLink to="/app/folders" className={({ isActive }) =>
              'flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ' +
              (isActive
                ? 'bg-gradient-to-br from-pink-600/40 to-pink-700/30 text-pink-200 shadow-lg shadow-pink-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>
              </span>
              <span className="text-[8px] font-bold leading-none">Carpetas</span>
            </NavLink>

            <NavLink to="/app/live" className={({ isActive }) =>
              'flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ' +
              (isActive
                ? 'bg-gradient-to-br from-purple-600/40 to-purple-700/30 text-purple-200 shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200')
            }>
              <span className="flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 18V6" />
                  <path d="M12 18V10" />
                  <path d="M18 18V4" />
                </svg>
              </span>
              <span className="text-[8px] font-bold leading-none">Live</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default MobileAppLayout
