import React from 'react'
import { useAuth } from '../../hooks/useAuth'

const TopBar: React.FC = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-holysong.primary flex items-center justify-center text-white font-bold">
          ♪
        </div>
        <div>
          <h1 className="text-xl font-semibold">HolySong</h1>
          <p className="text-xs text-slate-400">Letras, acordes y sesiones en vivo</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-xs">
          <p className="font-medium">{user?.email}</p>
          <p className="text-[10px] text-slate-400">Sesión iniciada con Google</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default TopBar
