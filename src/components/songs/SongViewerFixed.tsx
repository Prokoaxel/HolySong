
import React, { useMemo, useState, useRef, useEffect } from 'react'
import type { Comment } from '../../types'

type Instrument = 'guitar' | 'piano' | 'bass'

type Controls = {
  fontSize: number
  setFontSize: (v: number | ((n: number) => number)) => void
  transposeSteps: number
  setTransposeSteps: (v: number | ((n: number) => number)) => void
  capo: number
  setCapo: (v: number | ((n: number) => number)) => void
  instrument: Instrument
  setInstrument: (i: Instrument) => void
}

type SongViewerProps = {
  title: string
  tone: string
  content: string
  controls?: Controls
  comments?: Comment[]
  commentMode?: boolean
  onTextSelection?: () => void
  expandedCommentId?: string | null
  onToggleComment?: (id: string | null) => void
  onDeleteComment?: (id: string) => void
  currentUserId?: string
  onSwipePrev?: () => void
  onSwipeNext?: () => void
  externalTranspose?: number
  externalCapo?: number
}

const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const normalizeNote = (note: string) => {
  const map: Record<string, string> = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' }
  return map[note] || note
}

function parseChordSymbol(symbol: string): { root: string; quality: string } | null {
  const m = symbol.match(/^([A-G][#b]?)(.*)$/)
  if (!m) return null
  return { root: normalizeNote(m[1]), quality: m[2] || '' }
}

function getChordNotesFromSymbol(symbol: string): string[] {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) return []
  const idx = NOTES_SHARP.indexOf(parsed.root)
  if (idx === -1) return []
  const add = (s: number) => NOTES_SHARP[(idx + s + 12) % 12]
  const third = parsed.quality.startsWith('m') && !parsed.quality.startsWith('maj') ? add(3) : add(4)
  const fifth = add(7)
  return [parsed.root, third, fifth]
}

/* Guitarra: estilo póster con 6 cuerdas x 6 trastes, cejilla si aplica */
const GuitarDiagram: React.FC<{ chord: string }> = ({ chord }) => {
  const notes = getChordNotesFromSymbol(chord)
  const wanted = new Set(notes.map(n => normalizeNote(n)))
  const baseFret = 0
  const totalFrets = 6
  const rows = Array.from({ length: totalFrets }, (_, i) => baseFret + i)
  const tuning = ['E','A','D','G','B','E'] // 6→1

  const noteAt = (open: string, fret: number) => {
    const i = NOTES_SHARP.indexOf(normalizeNote(open))
    if (i < 0) return ''
    return NOTES_SHARP[(i + fret) % 12]
  }

  return (
    <div className="mt-3 text-[11px]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400">Guitarra</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">{chord}</span>
      </div>
      {/* Diagrama */}
      <div className="relative border-2 border-slate-600 bg-gradient-to-b from-slate-800 to-slate-900 rounded-md py-4 pl-6 pr-2">
        {/* Notas de cuerdas al aire (arriba) */}
        <div className="absolute -top-3 left-6 right-2 flex justify-between text-[9px] text-slate-300">
          {tuning.map((t, idx) => (
            <div key={idx} className="w-5 text-center">{t}</div>
          ))}
        </div>
        {rows.map((fretNum) => (
          <div key={fretNum} className="flex items-center border-b border-slate-600/50 last:border-b-2 last:border-slate-500 pb-2 mb-1 last:mb-0">
            {/* Número de traste a la izquierda dentro */}
            <div className="w-4 text-[9px] text-slate-400 flex-shrink-0 text-center">{fretNum}</div>
            <div className="flex justify-between flex-1">
              {tuning.map((open, sIdx) => {
                const n = noteAt(open, fretNum)
                const active = wanted.has(n)
                return (
                  <div key={sIdx} className="w-5 h-6 flex items-center justify-center relative">
                    {/* Cuerda vertical */}
                    <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-slate-500 -translate-x-1/2"></div>
                    {active ? (
                      <div className="w-5 h-5 rounded-full bg-teal-400 text-[9px] font-bold flex items-center justify-center text-slate-950 shadow-lg relative z-10 border-2 border-teal-300" title={n}>
                        {n}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[10px] text-slate-400">Notas (triada): {notes.join(' • ')}</div>
    </div>
  )
}

/* Piano: 1.5 octavas, mostrando la triada resaltada */
const PianoDiagram: React.FC<{ notes: string[] }> = ({ notes }) => {
  const active = new Set(notes.map(n => normalizeNote(n)))
  const whites = ['C','D','E','F','G','A','B']
  const blackMap: Record<string,string[]> = {
    C: ['C#'], D: ['D#'], E: [], F: ['F#'], G: ['G#'], A: ['A#'], B: [],
  }
  // 1.5 octavas => 11 teclas blancas (C a F)
  const whiteSequence = Array.from({ length: 11 }, (_, i) => whites[i % whites.length])
  const whiteWidth = 20
  const whiteHeight = 80
  const blackWidth = 12
  const blackHeight = 50

  return (
    <div className="mt-3">
      <p className="text-[11px] text-slate-400 mb-1">Piano</p>
      <div className="rounded-md bg-slate-900/90 p-2 overflow-x-auto scroll-dark">
        <div className="relative" style={{ width: whiteSequence.length * (whiteWidth + 2), height: whiteHeight, minWidth: '100%' }}>
          {whiteSequence.map((w, i) => (
            <div
              key={`w-${i}`}
              style={{ position: 'absolute', left: i * (whiteWidth + 2), top: 0, width: whiteWidth, height: whiteHeight }}
              className={
                'flex flex-col items-center justify-end text-[9px] rounded-sm border shadow-sm ' +
                (active.has(w) ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-slate-700 bg-white text-slate-700')
              }
            >
              {w}
            </div>
          ))}
          {whiteSequence.flatMap((w, i) => {
            const blacks = blackMap[w]
            return blacks.map((b) => (
              <div
                key={`b-${i}-${b}`}
                style={{ position: 'absolute', left: i * (whiteWidth + 2) + whiteWidth - blackWidth / 2, top: 0, width: blackWidth, height: blackHeight }}
                className={
                  'flex flex-col items-center justify-end text-[8px] rounded-sm border shadow-sm ' +
                  (active.has(b) ? 'border-teal-300 bg-teal-300 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-200')
                }
              >
                {b}
              </div>
            ))
          })}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Notas (triada): {Array.from(active).join(' • ')}</p>
    </div>
  )
}

/* Bajo: diapasón con 4 cuerdas y trastes 0-12, marcando notas del acorde */
const BassDiagram: React.FC<{ notes: string[] }> = ({ notes }) => {
  const strings = ['E','A','D','G']
  const frets = Array.from({ length: 9 }, (_, i) => i)
  const wanted = new Set(notes.map(n => normalizeNote(n)))

  const noteAt = (open: string, fret: number) => {
    const i = NOTES_SHARP.indexOf(normalizeNote(open))
    if (i < 0) return ''
    return NOTES_SHARP[(i + fret) % 12]
  }

  return (
    <div className="mt-3">
      <p className="text-[11px] text-slate-400 mb-1">Bajo (4 cuerdas)</p>
      <div className="border-2 border-slate-600 bg-gradient-to-b from-slate-800 to-slate-900 rounded-md py-4 pl-6 pr-2 relative">
        {/* Notas de cuerdas al aire (arriba) */}
        <div className="absolute -top-3 left-6 right-2 flex justify-between text-[9px] text-slate-300">
          {strings.map((t, idx) => (
            <div key={idx} className="w-7 text-center">{t}</div>
          ))}
        </div>
        {frets.map((fretNum) => (
          <div key={fretNum} className="flex items-center border-b border-slate-600/50 last:border-b-2 last:border-slate-500 pb-2 mb-1 last:mb-0">
            {/* Número de traste a la izquierda dentro */}
            <div className="w-4 text-[9px] text-slate-400 flex-shrink-0 text-center">{fretNum}</div>
            <div className="flex justify-between flex-1">
              {strings.map((s, idx) => {
                const n = noteAt(s, fretNum)
                const active = wanted.has(n)
                return (
                  <div key={idx} className="w-7 h-6 flex items-center justify-center relative" title={n}>
                    {/* Cuerda vertical */}
                    <div className="absolute inset-y-0 left-1/2 w-[2px] bg-slate-500 -translate-x-1/2"></div>
                    {active ? (
                      <div className="w-5 h-5 rounded-full bg-teal-400 text-[8px] font-bold flex items-center justify-center text-slate-950 shadow-lg relative z-10 border-2 border-teal-300">
                        {n}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SongViewerFixed: React.FC<SongViewerProps> = ({ 
  title, 
  tone, 
  content, 
  controls,
  comments = [],
  commentMode = false,
  onTextSelection,
  expandedCommentId,
  onToggleComment,
  onDeleteComment,
  currentUserId,
  onSwipePrev,
  onSwipeNext,
  externalTranspose,
  externalCapo
}) => {
  const [localInstrument] = useState<Instrument>('guitar')
  const instrument = controls?.instrument ?? localInstrument
  const fontSize = controls?.fontSize ?? 16
  const transposeSteps = externalTranspose !== undefined ? externalTranspose : (controls?.transposeSteps ?? 0)
  const capo = externalCapo !== undefined ? externalCapo : (controls?.capo ?? 0)
  const [showDiagram, setShowDiagram] = useState<boolean>(false)
  const [activeChord, setActiveChord] = useState<string>('C')
  const [diagramPos, setDiagramPos] = useState<{top:number;left:number}|null>(null)
  const chordBtnRefs = useRef<{[key:number]:HTMLButtonElement|null}>({})
  const notes = useMemo(() => getChordNotesFromSymbol(activeChord), [activeChord])
  const lyricsRef = useRef<HTMLDivElement>(null)
  
  // Swipe detection
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current
    
    // Horizontal swipe threshold: 80px
    // Ensure horizontal movement is dominant (deltaX > deltaY)
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && onSwipePrev) {
        // Swipe right = previous song
        onSwipePrev()
      } else if (deltaX < 0 && onSwipeNext) {
        // Swipe left = next song
        onSwipeNext()
      }
    }
  }
  
  const transposeNote = (n: string, steps: number) => {
    const idx = NOTES_SHARP.indexOf(normalizeNote(n))
    if (idx < 0) return n
    return NOTES_SHARP[(idx + steps + 12*10) % 12]
  }

  const transposeChord = (ch: string, steps: number) => {
    const m = ch.match(/^([A-G](?:#|b)?)(m|maj7|7|sus2|sus4)?(?:\/([A-G](?:#|b)?))?$/)
    if (!m) return ch
    const root = transposeNote(m[1], steps)
    const qual = m[2] || ''
    const bass = m[3] ? '/' + transposeNote(m[3], steps) : ''
    return `${root}${qual}${bass}`
  }

  // Estado para posición de iconos de comentarios
  const [commentMarkers, setCommentMarkers] = useState<Array<{
    commentId: string
    text: string
    x: number
    y: number
  }>>([])

  // Listener para modo comentario
  useEffect(() => {
    if (!commentMode || !lyricsRef.current) return

    const handleSelection = () => {
      if (onTextSelection) onTextSelection()
    }

    const element = lyricsRef.current
    element.addEventListener('mouseup', handleSelection)

    return () => {
      element.removeEventListener('mouseup', handleSelection)
    }
  }, [commentMode, onTextSelection])

  // Calcular posiciones de iconos de comentarios existentes
  useEffect(() => {
    if (!lyricsRef.current || comments.length === 0) {
      setCommentMarkers([])
      return
    }

    const markers: typeof commentMarkers = []

    comments.forEach(comment => {
      // Usar position_start del comentario para ubicación exacta
      const targetPosition = comment.position_start
      const selectionLength = comment.position_end - comment.position_start
      
      // Encontrar el nodo de texto que contiene esta posición exacta
      const range = document.createRange()
      
      try {
        // Buscar en todos los nodos de texto
        const walker = document.createTreeWalker(
          lyricsRef.current!,
          NodeFilter.SHOW_TEXT,
          null
        )

        let charCount = 0
        let node = walker.nextNode()
        let found = false

        while (node && !found) {
          const nodeText = node.textContent || ''
          const nodeEndPos = charCount + nodeText.length
          
          // Si esta posición objetivo está dentro de este nodo
          if (charCount <= targetPosition && targetPosition < nodeEndPos) {
            const offset = targetPosition - charCount
            const endOffset = Math.min(offset + selectionLength, nodeText.length)
            
            range.setStart(node, offset)
            range.setEnd(node, endOffset)
            
            const rect = range.getBoundingClientRect()
            const containerRect = lyricsRef.current!.getBoundingClientRect()
            
            markers.push({
              commentId: comment.id,
              text: comment.text_selection.trim(),
              x: rect.right - containerRect.left + 25, // Más a la derecha
              y: rect.top - containerRect.top - 28   // Más arriba
            })
            found = true
          }
          
          charCount = nodeEndPos
          node = walker.nextNode()
        }
      } catch (e) {
        console.error('Error calculando posición de comentario', e)
      }
    })

    setCommentMarkers(markers)
  }, [comments, content, fontSize, transposeSteps, capo])

  const renderContent = () => {
    // Detecta acordes como tokens sueltos: C, G, D7, G7, D/F#, A# etc.
    const chordToken = /^([A-G](?:#|b)?(?:m|maj7|7|sus2|sus4)?(?:\/[A-G](?:#|b)?)?)$/
    
    return (
      <>
        {content.split(/(\s+)/).map((tok, idx) => {
          const t = tok.trim()
          if (t && chordToken.test(t)) {
            const steps = transposeSteps - capo
            const chord = transposeChord(t, steps)
            return (
              <button
                key={idx}
                ref={el => chordBtnRefs.current[idx] = el}
                className="mx-0.5 px-2 py-1 rounded-md border-2 text-[12px] font-bold bg-gradient-to-br from-teal-500/20 to-teal-600/20 border-teal-400/70 text-teal-200 hover:from-teal-500/30 hover:to-teal-600/30 hover:border-teal-300 hover:scale-110 transition-all shadow-lg shadow-teal-500/20"
                onClick={() => {
                  setActiveChord(chord);
                  setShowDiagram(true);
                  const rect = chordBtnRefs.current[idx]?.getBoundingClientRect();
                  if (rect) {
                    const panelWidth = 340;
                    const xOffset = -40;
                    setDiagramPos({
                      top: rect.top + window.scrollY - 115,
                      left: Math.max(
                        10,
                        Math.min(
                          window.innerWidth - panelWidth - 10,
                          rect.left + rect.width/2 - panelWidth/2 + xOffset
                        )
                      ),
                    });
                  } else {
                    setDiagramPos(null);
                  }
                }}
                title={`Ver ${chord}`}
              >
                {chord}
              </button>
            )
          }
          // mantener espacios exactamente como vienen - NO renderizar iconos en la letra
          return <span key={idx} style={{ fontSize }}>{tok}</span>
        })}
      </>
    )
  }
  return (
    <div className="pt-0 px-1 pb-1 text-slate-200">
      {/* Contenedor centrado */}
      <div className="max-w-3xl mx-auto">
        <div className="rounded-md border border-slate-700 bg-slate-900/60 p-4 relative">
          <h1 className="text-lg font-semibold mb-1">{title}</h1>
          <p className="text-[12px] text-slate-400 mb-3">Tono: {tone}</p>
          
          {/* Indicador de modo comentario con animación mejorada */}
          {commentMode && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-pink-500/20 border-2 border-teal-400/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/10 to-purple-400/10 animate-[shimmer_2s_ease-in-out_infinite]" />
              <div className="relative flex items-center gap-3">
                <span className="text-2xl animate-bounce">✨</span>
                <div>
                  <p className="text-sm font-semibold text-teal-100">Modo Comentario Activo</p>
                  <p className="text-xs text-slate-300">Seleccioná cualquier parte de la letra para agregar una anotación</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Contenedor de letra con overlay de selección */}
          <div className="relative">
            {/* Overlay cuando está en modo comentario - aclara todo */}
            {commentMode && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] rounded-lg pointer-events-none z-10 animate-[fadeIn_300ms_ease]" />
            )}
            
            <div 
              ref={lyricsRef}
              className={
                "song-content-container text-sm whitespace-pre-wrap leading-7 relative rounded-lg transition-all duration-300 " +
                (commentMode ? "p-3 bg-slate-800/30 ring-2 ring-teal-400/30" : "")
              }
              style={{ 
                fontSize, 
                userSelect: commentMode ? 'text' : 'auto',
                textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)' // Contorno sutil
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {renderContent()}
            </div>

            {/* Iconos de comentarios flotantes SOBRE el texto comentado */}
            {commentMarkers.map(marker => {
              const comment = comments.find(c => c.id === marker.commentId)
              if (!comment) return null
              const isExpanded = expandedCommentId === marker.commentId
              const isOwner = currentUserId === comment.user_id

              return (
                <div key={marker.commentId} style={{ position: 'absolute', left: marker.x, top: marker.y, zIndex: 30 }}>
                  {/* Ícono de buzón simple */}
                  <button
                    onClick={() => onToggleComment?.(isExpanded ? null : marker.commentId)}
                    className="relative -translate-x-1/2 cursor-pointer"
                    title="Ver comentario"
                  >
                    <span className="text-2xl inline-block">
                      📬
                    </span>
                  </button>

                  {/* Burbuja de diálogo expandida con diseño mejorado */}
                  {isExpanded && (
                    <div 
                      className="absolute top-12 right-0 w-80 bg-gradient-to-br from-slate-900/98 via-purple-900/20 to-slate-900/98 backdrop-blur-md border-2 border-purple-400/60 rounded-2xl shadow-[0_20px_70px_rgba(168,85,247,0.4)] z-50 animate-[fadeIn_200ms_ease] overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Glow decorativo animado */}
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-purple-500/10 to-pink-500/10 animate-[shimmer_3s_ease-in-out_infinite]" />
                      
                      {/* Flecha apuntando al ícono con gradiente */}
                      <div className="absolute -top-3 right-4">
                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-purple-400"></div>
                      </div>
                      
                      <div className="relative p-4 space-y-3">
                        {/* Header con icono y título */}
                        <div className="flex items-center gap-2 pb-2 border-b border-purple-400/30">
                          <span className="text-lg animate-pulse">💭</span>
                          <span className="text-xs font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent uppercase tracking-wider">Comentario</span>
                        </div>
                        
                        {/* Texto comentado con diseño mejorado */}
                        <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-purple-900/40 border border-purple-500/30 p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs">📝</span>
                              <p className="text-[10px] text-purple-300 font-medium uppercase tracking-wide">Texto referenciado</p>
                            </div>
                            <p className="text-sm text-teal-200 italic font-medium">&quot;{comment.text_selection}&quot;</p>
                          </div>
                        </div>
                        
                        {/* Comentario con icono y estilo */}
                        <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 hover:border-purple-500/30 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="text-lg mt-0.5">💬</span>
                            <p className="text-sm text-slate-100 leading-relaxed flex-1">{comment.comment_text}</p>
                          </div>
                        </div>
                        
                        {/* Metadata con iconos */}
                        <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">👤</span>
                              <p className="font-medium text-purple-200">{comment.user_email}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">🕐</span>
                              <p className="text-slate-400">{new Date(comment.created_at).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                          </div>
                          
                          {/* Acciones (solo para el autor) */}
                          {isOwner && (
                            <button
                              onClick={() => onDeleteComment?.(comment.id)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-300 hover:from-red-500/30 hover:to-pink-500/30 text-[10px] font-semibold transition-all hover:scale-105 flex items-center gap-1"
                            >
                              <span>🗑️</span>
                              Eliminar
                            </button>
                          )}
                        </div>
                        
                        {/* Botón cerrar mejorado */}
                        <button
                          onClick={() => onToggleComment?.(null)}
                          className="w-full mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 hover:from-purple-800/50 hover:to-pink-800/50 border border-slate-600 hover:border-purple-500/50 text-[11px] font-medium transition-all text-slate-200"
                        >
                          Cerrar comentario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* Panel flotante pequeño, anclado cerca del acorde clicado */}
          {showDiagram && diagramPos && (
            <div
              style={{ position: 'fixed', top: diagramPos.top, left: diagramPos.left, zIndex: 50, width: 340, transform: 'translateY(-100%)' }}
              className="rounded-md border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-sm"
            >
              {/* Flecha decorativa tipo burbuja apuntando hacia arriba al acorde */}
              <div style={{ position: 'absolute', left: '50%', bottom: -10, transform: 'translateX(-50%)' }}>
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-700"></div>
                <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-slate-900/95 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px"></div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] text-slate-300">{instrument === 'guitar' ? 'Guitarra' : instrument === 'piano' ? 'Piano' : 'Bajo'}</span>
                <span className="px-2 py-0.5 rounded-full border border-teal-400 text-teal-200 bg-teal-500/10 text-[12px]">{activeChord}</span>
                <button className="ml-auto px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setShowDiagram(false)}>Ocultar</button>
              </div>
              <div className="max-w-[320px]">
                {instrument === 'guitar' && <GuitarDiagram chord={activeChord} />}
                {instrument === 'piano' && <PianoDiagram notes={notes} />}
                {instrument === 'bass' && <BassDiagram notes={notes} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SongViewerFixed
