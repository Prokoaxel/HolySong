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
    <div className="min-h-screen relative overflow-hidden text-slate-50">
      {/* Fondo base oscuro */}
      <div className="absolute inset-0 -z-30 bg-slate-950" />

      {/* Hero decorative pattern */}
      <div className="absolute inset-0 -z-25 opacity-30">
        <img src="/src/assets/hero-pattern.svg" alt="hero pattern" className="w-full h-full object-cover" />
      </div>

      {/* “Luces” de escenario con gradientes */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(45,212,191,0.32), transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(129,140,248,0.35), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(244,114,182,0.20), transparent 55%)
          `,
        }}
      />

      {/* Sutil textura diagonal */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] mix-blend-soft-light"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #0f172a 25%, transparent 25%, transparent 50%, #0f172a 50%, #0f172a 75%, transparent 75%, transparent)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="relative h-14 border-b border-slate-800 bg-slate-950/70 backdrop-blur flex items-center justify-between px-4 md:px-8">
          {/* Header rotating glow */}
          <div className="header-glow pointer-events-none">
            <div className="ring" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs hover:border-teal-400 hover:text-teal-200 bg-slate-900/80"
            >
              ← Volver
            </button>
            <div className="flex items-center gap-2">
              {/* Icono principal (logo) */}
              <div className="relative w-12 h-12 logo-ornament">
                <div className="logo-ring" />
                <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30 bg-gradient-to-br from-teal-400 to-purple-700 animate-rotate-slow"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="/src/assets/logo.svg" alt="HolySong logo" className="w-9 h-9 animate-breath" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">HolySong</p>
                <p className="text-[11px] text-slate-400 leading-none">
                  Letras, acordes y sesiones en vivo
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 md:gap-3">
            <NavLink to="/app" end className={linkClass}>
              Inicio
            </NavLink>
            <NavLink to="/app/import" className={linkClass}>
              Importar
            </NavLink>
            <NavLink to="/app/library" className={linkClass}>
              Biblioteca
            </NavLink>
            <NavLink to="/app/folders" className={linkClass}>
              Carpetas
            </NavLink>
            <NavLink to="/app/live" className={linkClass}>
              Sesión en vivo
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 text-[11px] md:text-xs">
            {user && (
              <span className="text-slate-400 hidden sm:inline">
                {user.email}
              </span>
            )}
            {user && (
              <button
                onClick={signOut}
                className="rounded-full border border-slate-700 px-3 py-1 hover:border-red-500 hover:text-red-300 bg-slate-900/80"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 px-3 md:px-8 py-4 md:py-6">
          <Outlet />
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 text-[11px] text-center text-slate-500 py-2">
          HolySong © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
