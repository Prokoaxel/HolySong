import React, { useState, useEffect } from 'react'
import { verses } from '../../data/verses'

type Props = {
  className?: string
}

const VerseBanner: React.FC<Props> = ({ className }) => {
  const [currentVerse, setCurrentVerse] = useState(verses[0])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const changeVerse = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * verses.length)
      setCurrentVerse(verses[randomIndex])
      setIsTransitioning(false)
    }, 300)
  }

  useEffect(() => {
    // Cambiar versículo al montar el componente
    changeVerse()
    
    // Cambiar versículo cada 12 horas (12 * 60 * 60 * 1000 ms)
    const interval = setInterval(changeVerse, 12 * 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={(className ? className + ' ' : '') + 'relative rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 p-5 md:p-6 overflow-hidden shadow-xl shadow-purple-500/10'}>
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
      
      <div className={`relative flex items-start gap-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur animate-pulse" />
          <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-400/50 flex items-center justify-center text-purple-200 shadow-lg">
            <span className="text-xl">📖</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {currentVerse.reference}
            </p>
            <button
              onClick={changeVerse}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-[10px] font-bold text-purple-300 uppercase tracking-wider transition-all hover:scale-105"
              title="Cambiar versículo"
            >
              <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
              Cambiar
            </button>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
            "{currentVerse.text}"
          </p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Reina Valera 1960
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerseBanner
