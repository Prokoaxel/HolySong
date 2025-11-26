import React from 'react'

type Props = {
  title: string
  description: string
  onClick?: () => void
  emoji?: string
  imageUrl?: string
}

const MainMenuCard: React.FC<Props> = ({ title, description, onClick, emoji, imageUrl }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-400/80 shadow-lg hover:shadow-emerald-500/20 transition transform hover:-translate-y-1 text-left card-tilt"
    >
      {/* Imagen de fondo */}
      {imageUrl && (
        <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition hero-fade">
          <img src={imageUrl} alt="card image" className="w-full h-full object-cover opacity-60"/>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950/95" />

      <div className="relative p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {emoji && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xl">
              <span>{emoji}</span>
            </div>
          )}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-xs text-slate-300">{description}</p>
        <span className="mt-2 text-xs text-emerald-400 group-hover:underline">
          Abrir →
        </span>
      </div>
    </button>
  )
}

export default MainMenuCard
