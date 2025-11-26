import React from 'react'
import { useNavigate } from 'react-router-dom'

const BackButton: React.FC = () => {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 hover:border-emerald-400/70 transition"
    >
      <span>←</span>
      <span>Volver</span>
    </button>
  )
}

export default BackButton
