import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const TopBar: React.FC = () => {
  const { user, signOut } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const getGreeting = () => {
    const hour = time.getHours()
    if (hour < 12) return '🌅 Buenos días'
    if (hour < 19) return '☀️ Buenas tardes'
    return '🌙 Buenas noches'
  }

  return (
    <header className="relative overflow-hidden">
      {/* Fondo con gradiente y efectos */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
      
      {/* Líneas decorativas animadas */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      
      <div className="relative flex items-center justify-between px-6 py-3 backdrop-blur-xl">
        {/* Logo y nombre */}
        <div className="relative flex items-center gap-4 group">
          {/* Logo con múltiples capas */}
          <div className="relative w-14 h-14">
            {/* Glow exterior */}
            <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-teal-500/20 rounded-full blur-xl opacity-60 animate-pulse" />
            
            {/* Anillo rotatorio 1 */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-br from-purple-500/40 to-pink-500/40 animate-spin-slow" style={{ animationDuration: '10s' }} />
            
            {/* Anillo rotatorio 2 (dirección opuesta) */}
            <div className="absolute inset-1 rounded-full border-2 border-transparent bg-gradient-to-tr from-teal-500/30 to-purple-500/30 animate-spin-slow" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
            
            {/* Logo central */}
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-400/60 shadow-2xl shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <span className="text-2xl animate-bounce-slow">🎵</span>
            </div>
            
            {/* Partículas flotantes */}
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-teal-300 bg-clip-text text-transparent tracking-tight drop-shadow-lg">
                HolySong
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[9px] font-bold text-purple-300 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase flex items-center gap-1.5">
              <span className="text-purple-400">⚡</span>
              Letras & Acordes en Vivo
              <span className="text-teal-400">✨</span>
            </p>
          </div>
        </div>

        {/* Centro - Reloj y saludo */}
        <div className="hidden md:flex flex-col items-center gap-1 px-6 py-2 rounded-2xl bg-gradient-to-r from-slate-900/80 via-purple-900/20 to-slate-900/80 border border-purple-500/30 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
          <p className="text-xs font-bold text-purple-200 tracking-wide">{getGreeting()}</p>
          <p className="text-2xl font-black bg-gradient-to-r from-teal-300 to-purple-300 bg-clip-text text-transparent tabular-nums">
            {formatTime(time)}
          </p>
        </div>

        {/* Usuario y botón de cerrar sesión */}
        <div className="relative flex items-center gap-4">
          {/* Card de usuario mejorada */}
          <div className="group/user relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border-2 border-purple-500/30 shadow-lg shadow-purple-500/10 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            {/* Glow en hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-pink-500/0 rounded-2xl opacity-0 group-hover/user:opacity-100 blur transition-opacity duration-300" />
            
            {/* Avatar */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full blur animate-pulse" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-teal-600/30 border-2 border-purple-400/60 flex items-center justify-center shadow-xl backdrop-blur-sm">
                <span className="text-lg">👤</span>
              </div>
              {/* Indicador online */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse shadow-lg shadow-green-400/50" />
            </div>
            
            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-100 leading-tight tracking-wide">{user?.email?.split('@')[0]}</p>
              <p className="text-[9px] text-purple-300 leading-tight font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                Conectado
              </p>
            </div>
          </div>
          
          {/* Botón de cerrar sesión mejorado */}
          <button 
            onClick={signOut} 
            className="group/btn relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-black uppercase tracking-wider transition-all hover:scale-110 active:scale-95 border-2 border-red-400/50 shadow-xl shadow-red-500/30 overflow-hidden"
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
            
            <span className="relative flex items-center gap-2">
              <span className="text-base group-hover/btn:rotate-[20deg] group-hover/btn:scale-125 transition-all duration-300">🚪</span>
              Salir
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
