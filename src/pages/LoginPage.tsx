import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>
  if (user) return <Navigate to="/app" replace />

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-slate-50">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-700/70 p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-transparent flex items-center justify-center logo-ornament">
            <div className="logo-ring" />
            <img src="/src/assets/logo.svg" className="w-10 h-10 animate-breath transform transition-transform duration-200" alt="HolySong"/>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">HolySong</h1>
            <p className="text-xs text-slate-400">Tu cuaderno digital de acordes</p>
          </div>
        </div>

        <h2 className="text-lg mb-2 font-semibold">Bienvenido de nuevo</h2>
        <p className="text-xs text-slate-400 mb-6">
          Inicia sesión con tu cuenta de Google para acceder a tus canciones, carpetas y sesiones en vivo.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 py-2 text-sm font-medium hover:bg-slate-100 transition"
        >
          <span>Continuar con Google</span>
        </button>

        <p className="mt-6 text-[10px] text-slate-500 text-center">
          HolySong © Copyright 2025
        </p>
      </div>
    </div>
  )
}

export default LoginPage
