import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type SongViewerProps = {
  title: string
  tone: string
  content: string
  onAddToFolder?: () => void

  // cuando viene de sesión en vivo, estos pisan el valor local
  externalTranspose?: number | null
  externalCapo?: number | null
  // Optional controls provided by parent to lift state
  controls?: {
    fontSize?: number
    setFontSize?: (v: number) => void
    transposeSteps?: number
    setTransposeSteps?: (v: number) => void
    capo?: number
    setCapo?: (v: number) => void
    bpm?: number
    setBpm?: (v: number) => void
    metronomeOn?: boolean
    setMetronomeOn?: (v: boolean) => void
    autoScrollOn?: boolean
    setAutoScrollOn?: (v: boolean) => void
    scrollSpeed?: number
    setScrollSpeed?: (v: number) => void
    instrument?: Instrument
    setInstrument?: (v: Instrument) => void
  }
}

type Instrument = 'guitar' | 'piano' | 'bass'

const chordRegex =
  /\b([A-G][#b]?)(m|maj7|m7|sus4|sus2|dim|aug|add9|7|9|11|13)?(\/[A-G][#b]?)?\b/g

const NOTES_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

const NOTES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]

const chooseScale = (t: string) =>
  /b/.test(t) ? NOTES_FLAT : NOTES_SHARP

const normalizeNote = (note: string) => {
  const map: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  }
  return map[note] || note
}

const transposeNote = (note: string, steps: number) => {
  const base = normalizeNote(note)
  const idx = NOTES_SHARP.indexOf(base)
  if (idx === -1) return note
  const newIndex = (idx + steps + 12) % 12
  return NOTES_SHARP[newIndex]
}

/* ==== Utilidades de acordes para el popup ==== */

type ParsedChord = {
  root: string
  quality: string
  bass?: string
}

function parseChordSymbol(symbol: string): ParsedChord | null {
  const [main, bassPart] = symbol.split('/')
  const m = main.match(/^([A-G][#b]?)(.*)$/)
  if (!m) return null
  const root = normalizeNote(m[1])
  const quality = m[2] || ''
  const bass = bassPart ? normalizeNote(bassPart) : undefined
  return { root, quality, bass }
}

function getChordNotesFromSymbol(symbol: string): string[] {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) return []
  const idx = NOTES_SHARP.indexOf(parsed.root)
  if (idx === -1) return []

  const add = (s: number) =>
    NOTES_SHARP[(idx + s + 12) % 12]

  let third = add(4)
  let fifth = add(7)
  let seventh: string | null = null

  // menor si empieza con "m" y no "maj"
  if (
    parsed.quality.startsWith('m') &&
    !parsed.quality.startsWith('maj')
  ) {
    third = add(3)
  }

  if (/maj7/.test(parsed.quality)) {
    seventh = add(11)
  } else if (/7/.test(parsed.quality)) {
    seventh = add(10)
  }

  const notes = [parsed.root, third, fifth]
  if (seventh) notes.push(seventh)
  if (parsed.bass && !notes.includes(parsed.bass)) {
    notes.push(parsed.bass)
  }
  return notes
}

/* ==== Diccionario simple de acordes de guitarra ==== */

type GuitarShape = {
  /** frets por cuerda de 6ª a 1ª: -1 mute, 0 al aire, >0 traste */
  frets: number[]
  /** dedos por cuerda, mismo orden; null si no aplica */
  fingers: (number | null)[]
  name?: string
}

const guitarChordDict: Record<string, GuitarShape[]> = {
  // mayores abiertos
  C: [
    {
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [null, 3, 2, null, 1, null],
      name: 'C abierto',
    },
  ],
  D: [
    {
      frets: [-1, -1, 0, 2, 3, 2],
      fingers: [null, null, null, 1, 3, 2],
      name: 'D abierto',
    },
  ],
  E: [
    {
      frets: [0, 2, 2, 1, 0, 0],
      fingers: [null, 2, 3, 1, null, null],
      name: 'E abierto',
    },
  ],
  F: [
    {
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      name: 'F cejilla',
    },
  ],
  G: [
    {
      frets: [3, 2, 0, 0, 0, 3],
      fingers: [2, 1, null, null, null, 3],
      name: 'G abierto',
    },
  ],
  A: [
    {
      frets: [-1, 0, 2, 2, 2, 0],
      fingers: [null, null, 1, 2, 3, null],
      name: 'A abierto',
    },
  ],
  B: [
    {
      frets: [-1, 2, 4, 4, 4, 2],
      fingers: [null, 1, 3, 4, 2, 1],
      name: 'B cejilla',
    },
  ],

  // menores
  Am: [
    {
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: [null, null, 2, 3, 1, null],
      name: 'Am abierto',
    },
  ],
  Dm: [
    {
      frets: [-1, -1, 0, 2, 3, 1],
      fingers: [null, null, null, 2, 3, 1],
      name: 'Dm abierto',
    },
  ],
  Em: [
    {
      frets: [0, 2, 2, 0, 0, 0],
      fingers: [null, 2, 3, null, null, null],
      name: 'Em abierto',
    },
  ],
  Bm: [
    {
      frets: [-1, 2, 4, 4, 3, 2],
      fingers: [null, 1, 3, 4, 2, 1],
      name: 'Bm cejilla',
    },
  ],
  Fm: [
    {
      frets: [1, 3, 3, 1, 1, 1],
      fingers: [1, 3, 4, 1, 1, 1],
      name: 'Fm cejilla',
    },
  ],
  Gm: [
    {
      frets: [3, 5, 5, 3, 3, 3],
      fingers: [1, 3, 4, 1, 1, 1],
      name: 'Gm cejilla',
    },
  ],
  Cmaj7: [
    {
      frets: [-1, 3, 2, 0, 0, 0],
      fingers: [null, 3, 2, null, null, null],
      name: 'Cmaj7',
    },
  ],
  Gmaj7: [
    {
      frets: [3, 2, 0, 0, 0, 2],
      fingers: [3, 2, null, null, null, 1],
      name: 'Gmaj7',
    },
  ],
  D7: [
    {
      frets: [-1, -1, 0, 2, 1, 2],
      fingers: [null, null, null, 2, 1, 3],
      name: 'D7',
    },
  ],
  E7: [
    {
      frets: [0, 2, 0, 1, 0, 0],
      fingers: [null, 2, null, 1, null, null],
      name: 'E7',
    },
  ],
}

/* Dibujo esquemático de guitarra */

const GuitarDiagram: React.FC<{ chord: string }> = ({ chord }) => {
  const shapes =
    guitarChordDict[chord] ||
    guitarChordDict[
      normalizeNote(
        chord
          .replace(/m.*/, 'm')
          .replace(/maj7|7.*/, ''),
      )
    ] ||
    null

  if (!shapes) {
    return (
      <p className="text-[11px] text-slate-400 mt-2">
        Todavía no tenemos diagrama guardado para este acorde.
      </p>
    )
  }

  const shape = shapes[0]
  const frets = shape.frets
  const fingers = shape.fingers

  const usedFrets = frets.filter(f => f > 0)
  const minFret = usedFrets.length ? Math.min(...usedFrets) : 1
  const maxFret = usedFrets.length ? Math.max(...usedFrets) : 4
  const baseFret = Math.min(minFret, 4)
  const totalFrets = Math.max(4, maxFret - baseFret + 1)

  const rows = Array.from({ length: totalFrets }, (_, i) => baseFret + i)

  return (
    <div className="mt-3 text-[11px]">
      {shape.name && (
        <p className="mb-1 text-slate-400">Posición: {shape.name}</p>
      )}

      {/* marcas arriba: X / O */}
      <div className="flex justify-between px-2 mb-1">
        {frets.map((f, i) => (
          <div
            key={i}
            className="w-4 text-center text-[10px] text-slate-400"
          >
            {f === -1 ? '×' : f === 0 ? '○' : ' '}
          </div>
        ))}
      </div>

      {/* diagrama */}
      <div className="border border-slate-600 bg-slate-900/80 rounded-lg px-2 py-1">
        {rows.map(fretNum => (
          <div
            key={fretNum}
            className="flex justify-between items-center"
          >
            {frets.map((f, stringIdx) => {
              const isDot = f === fretNum
              const finger = fingers[stringIdx]
              return (
                <div
                  key={stringIdx}
                  className="w-4 h-6 flex items-center justify-center border-l border-slate-700 last:border-r"
                >
                  {isDot ? (
                    <div className="w-4 h-4 rounded-full bg-amber-400 text-[9px] flex items-center justify-center text-slate-950">
                      {finger ?? ''}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
        {baseFret > 1 && (
          <p className="text-[9px] text-right text-slate-500 mt-1">
            traste {baseFret}
          </p>
        )}
      </div>
    </div>
  )
}

/* Piano simplificado: 12 teclas C–B con notas del acorde marcadas */

const PIANO_KEYS = NOTES_SHARP

const PianoDiagram: React.FC<{ notes: string[] }> = ({ notes }) => {
  const active = new Set(notes.map(n => normalizeNote(n)))

  return (
    <div className="mt-3">
      <p className="text-[11px] text-slate-400 mb-1">Teclas activas</p>
      <div className="flex gap-[2px] rounded-md bg-slate-900/90 p-1">
        {PIANO_KEYS.map(k => {
          const isActive = active.has(k)
          const isBlack = k.includes('#')
          return (
            <div
              key={k}
              className={
                'flex-1 h-10 flex flex-col items-center justify-end text-[9px] rounded-sm border ' +
                (isActive
                  ? 'border-teal-300 bg-teal-400 text-slate-950'
                  : isBlack
                  ? 'border-slate-700 bg-slate-800 text-slate-300'
                  : 'border-slate-700 bg-slate-950 text-slate-400')
              }
            >
              {k}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* Popup de acorde */

const ChordPopup: React.FC<{
  chord: string
  instrument: Instrument
  onClose: () => void
}> = ({ chord, instrument, onClose }) => {
  const notes = useMemo(() => getChordNotesFromSymbol(chord), [chord])

  return (
    <div className="shadow-2xl rounded-2xl border border-slate-800 bg-slate-950/98 p-3 w-72 text-xs text-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Acorde</p>
          <p className="text-lg font-semibold">{chord}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 text-[11px]"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Instrumento:</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] uppercase tracking-wide">
          {instrument === 'guitar'
            ? 'Guitarra'
            : instrument === 'piano'
            ? 'Piano'
            : 'Bajo'}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-400 mb-1">Notas del acorde</p>
        {notes.length ? (
          <p className="text-[11px] text-teal-200">
            {notes.join(' • ')}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">
            No pudimos analizar este acorde todavía.
          </p>
        )}
      </div>

      {instrument === 'guitar' && <GuitarDiagram chord={chord} />}

      {instrument === 'piano' && <PianoDiagram notes={notes} />}

      {instrument === 'bass' && (
        <div className="mt-3 text-[11px] text-slate-400">
          Para bajo, usá la nota raíz{' '}
          {notes[0] && (
            <span className="text-teal-200 font-semibold">
              {notes[0]}
            </span>
          )}{' '}
          como referencia en la cuerda más grave. Más adelante podemos agregar
          diagramas específicos de bajo.
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-3 w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1 text-[11px]"
      >
        Cerrar
      </button>
    </div>
  )
}

/* ==== SongViewer principal ==== */

const SongViewer: React.FC<SongViewerProps> = ({
  title,
  tone,
  content,
  onAddToFolder,
  externalTranspose = null,
  externalCapo = null,
  controls,
}) => {
  // Allow lifting control state from parent (if provided), else use local state
  const [localFontSize, localSetFontSize] = useState(16)
  const fontSize = controls?.fontSize ?? localFontSize
  const setFontSize = controls?.setFontSize ?? localSetFontSize

  const [localTransposeSteps, localSetTransposeSteps] = useState(0)
  const transposeSteps = controls?.transposeSteps ?? localTransposeSteps
  const setTransposeSteps = controls?.setTransposeSteps ?? localSetTransposeSteps

  const [localCapo, localSetCapo] = useState(0)
  const capo = controls?.capo ?? localCapo
  const setCapo = controls?.setCapo ?? localSetCapo

  const [localBpm, localSetBpm] = useState(80)
  const bpm = controls?.bpm ?? localBpm
  const setBpm = controls?.setBpm ?? localSetBpm

  const [localMetronomeOn, localSetMetronomeOn] = useState(false)
  const metronomeOn = controls?.metronomeOn ?? localMetronomeOn
  const setMetronomeOn = controls?.setMetronomeOn ?? localSetMetronomeOn

  const [localAutoScrollOn, localSetAutoScrollOn] = useState(false)
  const autoScrollOn = controls?.autoScrollOn ?? localAutoScrollOn
  const setAutoScrollOn = controls?.setAutoScrollOn ?? localSetAutoScrollOn

  const [localScrollSpeed, localSetScrollSpeed] = useState(1)
  const scrollSpeed = controls?.scrollSpeed ?? localScrollSpeed
  const setScrollSpeed = controls?.setScrollSpeed ?? localSetScrollSpeed

  const [localInstrument, localSetInstrument] = useState<Instrument>('guitar')
  const instrument = controls?.instrument ?? localInstrument
  const setInstrument = controls?.setInstrument ?? localSetInstrument
  const [activeChord, setActiveChord] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const metronomeInterval = useRef<number | null>(null)

  // si vienen valores de la sesión en vivo, pisan el local
  useEffect(() => {
    if (externalTranspose !== null && externalTranspose !== undefined) {
      setTransposeSteps(externalTranspose)
    }
  }, [externalTranspose])

  useEffect(() => {
    if (externalCapo !== null && externalCapo !== undefined) {
      setCapo(externalCapo)
    }
  }, [externalCapo])

  const scale = useMemo(() => chooseScale(tone || 'C'), [tone])

  const currentTone = useMemo(() => {
    if (!tone) return ''
    const base = normalizeNote(tone)
    const idx = NOTES_SHARP.indexOf(base)
    if (idx === -1) return tone
    const newIndex = (idx + transposeSteps + 12) % 12
    return NOTES_SHARP[newIndex]
  }, [tone, transposeSteps])

  const setToneByName = (target: string) => {
    if (!tone) return
    const from = normalizeNote(tone)
    const fromIdx = NOTES_SHARP.indexOf(from)
    const toIdx = NOTES_SHARP.indexOf(normalizeNote(target))
    if (fromIdx === -1 || toIdx === -1) return
    let steps = toIdx - fromIdx
    if (steps > 6) steps -= 12
    if (steps < -6) steps += 12
    setTransposeSteps(steps)
  }

  // metrónomo
  useEffect(() => {
    if (!metronomeOn) {
      if (metronomeInterval.current) {
        window.clearInterval(metronomeInterval.current)
        metronomeInterval.current = null
      }
      return
    }

    const intervalMs = 60000 / bpm
    metronomeInterval.current = window.setInterval(() => {
      // acá podrías disparar un sonido en el futuro
      console.log('tick')
    }, intervalMs)

    return () => {
      if (metronomeInterval.current) {
        window.clearInterval(metronomeInterval.current)
        metronomeInterval.current = null
      }
    }
  }, [metronomeOn, bpm])

  // autoscroll
  useEffect(() => {
    if (!autoScrollOn) return
    let frame: number

    const step = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += scrollSpeed
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [autoScrollOn, scrollSpeed])

  const handleChordClick = (full: string) => {
    // transponemos también el acorde que se muestra en el popup
    const [root, quality = '', bass = ''] =
      full.match(/^([A-G][#b]?)(.*?)(\/[A-G][#b]?)?$/)?.slice(1) || [full, '', '']

    let transposed = full
    if (root) {
      const newRoot = transposeNote(root, transposeSteps)
      let newBass = ''
      if (bass) {
        const bassNote = bass.slice(1)
        newBass = '/' + transposeNote(bassNote, transposeSteps)
      }
      transposed = newRoot + quality + newBass
    }
    setActiveChord(transposed)
  }

  const renderLine = (text: string, index: number) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    // MUY importante resetear lastIndex del regex
    chordRegex.lastIndex = 0

    while ((match = chordRegex.exec(text)) !== null) {
      const [full, root, quality = '', bass = ''] = match
      const i = match.index

      if (i > lastIndex) {
        parts.push(text.slice(lastIndex, i))
      }

      let transposed = full
      if (root) {
        const newRoot = transposeNote(root, transposeSteps)
        let newBass = ''
        if (bass) {
          const bassNote = bass.slice(1)
          newBass = '/' + transposeNote(bassNote, transposeSteps)
        }
        transposed = newRoot + quality + newBass
      }

      parts.push(
        <button
          key={i}
          type="button"
          onClick={() => handleChordClick(full)}
          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-[1px] rounded-md border border-amber-400/70 bg-amber-500/10 text-amber-300 text-[11px] font-semibold leading-none align-baseline hover:bg-amber-400/20 hover:border-amber-300"
        >
          {transposed}
        </button>,
      )

      lastIndex = i + full.length
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return <div key={index}>{parts}</div>
  }

  return (
    <div className="flex gap-6 relative">
      {/* Decorative glowing circle and halo */}
      <div className="songviewer-halo" />
      <div className="absolute right-6 top-6 w-44 h-44 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/10 blur-3xl pointer-events-none animate-heroFade -z-10" />
      {/* Panel lateral (si no viene `controls` desde el padre) */}
      { !controls && (
        <aside className="w-64 shrink-0 space-y-4">
        <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-3 text-xs space-y-3">
          <p className="font-semibold mb-1">Texto</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(f => Math.max(12, f - 1))}
              className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(f => Math.min(28, f + 1))}
              className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"
            >
              A+
            </button>
          </div>

          {/* Instrumento */}
          <div className="mt-3 space-y-2">
            <p className="font-semibold">Instrumento</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInstrument('guitar')}
                className={
                  'flex-1 rounded-md px-2 py-1 border text-[11px] ' +
                  (instrument === 'guitar'
                    ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500')
                }
              >
                Guitarra
              </button>
              <button
                type="button"
                onClick={() => setInstrument('piano')}
                className={
                  'flex-1 rounded-md px-2 py-1 border text-[11px] ' +
                  (instrument === 'piano'
                    ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500')
                }
              >
                Piano
              </button>
              <button
                type="button"
                onClick={() => setInstrument('bass')}
                className={
                  'flex-1 rounded-md px-2 py-1 border text-[11px] ' +
                  (instrument === 'bass'
                    ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500')
                }
              >
                Bajo
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              El instrumento elegido se usa para mostrar el diagrama cuando
              tocás un acorde.
            </p>
          </div>

          {/* Tono / transponer */}
          <div className="mt-4 space-y-2">
            <p className="font-semibold">Tono</p>
            <p className="text-[11px] text-slate-400">
              Original:{' '}
              <span className="text-orange-400 font-semibold">
                {tone || '-'}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Actual:{' '}
              <span className="text-orange-400 font-semibold">
                {currentTone || tone || '-'}
              </span>
            </p>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setTransposeSteps(s => Math.max(-12, s - 1))}
                className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                disabled={
                  externalTranspose !== null &&
                  externalTranspose !== undefined
                }
              >
                - ½
              </button>
              <button
                onClick={() => setTransposeSteps(s => Math.min(12, s + 1))}
                className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                disabled={
                  externalTranspose !== null &&
                  externalTranspose !== undefined
                }
              >
                + ½
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 mt-2">
              {scale.map(n => (
                <button
                  key={n}
                  onClick={() => setToneByName(n)}
                  disabled={
                    externalTranspose !== null &&
                    externalTranspose !== undefined
                  }
                  className={
                    'rounded-md py-1 text-[11px] border ' +
                    (normalizeNote(currentTone) === normalizeNote(n)
                      ? 'border-teal-400 bg-slate-900 text-teal-300'
                      : 'border-slate-700 bg-slate-900/60 hover:border-slate-500')
                  }
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={() => setTransposeSteps(0)}
              disabled={
                externalTranspose !== null &&
                externalTranspose !== undefined
              }
              className="mt-2 w-full rounded bg-slate-800 py-1 text-[11px]"
            >
              Restaurar tono inicial
            </button>
          </div>

          {/* Capo */}
          <div className="mt-4 space-y-2">
            <p className="font-semibold">Capo</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={7}
                value={capo}
                onChange={e =>
                  setCapo(parseInt(e.target.value, 10))
                }
                disabled={
                  externalCapo !== null &&
                  externalCapo !== undefined
                }
                className="flex-1"
              />
              <span className="text-[11px] w-6 text-right">
                {capo}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Ajustá el traste del capo (indicador visual).
            </p>
          </div>

          {/* Metrónomo */}
          <div className="mt-4 space-y-2">
            <p className="font-semibold">Metrónomo</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={40}
                max={220}
                value={bpm}
                onChange={e =>
                  setBpm(
                    Math.min(
                      220,
                      Math.max(40, Number(e.target.value) || 40),
                    ),
                  )
                }
                className="w-16 rounded bg-slate-900/80 border border-slate-700 px-2 py-1 text-[11px]"
              />
              <span className="text-[11px] text-slate-400">
                BPM
              </span>
              <button
                onClick={() => setMetronomeOn(on => !on)}
                className={
                  'flex-1 rounded py-1 text-[11px] ' +
                  (metronomeOn
                    ? 'bg-teal-500 text-slate-900 font-semibold'
                    : 'bg-slate-800')
                }
              >
                {metronomeOn ? 'Parar' : 'Iniciar'}
              </button>
            </div>
          </div>

          {/* Autoscroll */}
          <div className="mt-4 space-y-2">
            <p className="font-semibold">Autoscroll</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={4}
                value={autoScrollOn ? scrollSpeed : 0}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (v === 0) {
                    setAutoScrollOn(false)
                  } else {
                    setScrollSpeed(v)
                    setAutoScrollOn(true)
                  }
                }}
                className="flex-1"
              />
              <span className="text-[11px] w-6 text-right">
                {autoScrollOn ? scrollSpeed : 0}
              </span>
            </div>
          </div>

          {/* Botones inferiores */}
          <button
            className="mt-3 w-full rounded bg-slate-800 py-1 text-[11px]"
            onClick={onAddToFolder}
          >
            Agregar a carpeta
          </button>
          <button className="w-full rounded bg-slate-800 py-1 text-[11px]">
            Descargar PDF
          </button>
        </div>
        </aside>
      ) }

      {/* Letra con acordes */}
      <section
        ref={scrollRef}
        className="flex-1 rounded-2xl bg-slate-950/80 border border-slate-800 p-5 overflow-auto max-h-[75vh]"
      >
        <h1 className="text-xl font-semibold mb-1">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mb-4">
          Tono actual:{' '}
          <span className="text-orange-400 font-semibold">
            {currentTone || tone || '-'}
          </span>
          {capo > 0 && (
            <span className="ml-2 text-[11px] text-slate-400">
              (Capo traste {capo})
            </span>
          )}
        </p>

        <pre
          className="font-mono whitespace-pre-wrap leading-6"
          style={{ fontSize }}
        >
          {content.split('\n').map((line, i) => renderLine(line, i))}
        </pre>
      </section>

      {/* Popup de acorde */}
      {activeChord && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChordPopup
            chord={activeChord}
            instrument={instrument}
            onClose={() => setActiveChord(null)}
          />
        </div>
      )}
    </div>
  )
}

export default SongViewer
