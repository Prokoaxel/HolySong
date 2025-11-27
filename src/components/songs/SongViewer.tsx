/*
import React, { useMemo, useState } from 'react'

type Instrument = 'guitar' | 'piano' | 'bass'

type SongViewerProps = {
  title: string
  tone: string
  content: string
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

const GuitarDiagram: React.FC<{ chord: string }> = ({ chord }) => {
  const notes = getChordNotesFromSymbol(chord)
  return (
    <div className="mt-3 text-[11px]">
      <p className="text-slate-400 mb-1">Guitarra (simplificado)</p>
      <div className="border border-slate-600 bg-slate-100 rounded-lg px-3 py-3">
        {notes.join(' • ')}
      </div>
    </div>
  )
}

const PianoDiagram: React.FC<{ notes: string[] }> = ({ notes }) => (
  <div className="mt-3">
    <p className="text-[11px] text-slate-400 mb-1">Piano (simplificado)</p>
    <div className="rounded-md bg-slate-900/90 p-2">{notes.join(' • ')}</div>
  </div>
)

const BassDiagram: React.FC<{ notes: string[] }> = ({ notes }) => (
  <div className="mt-3">
    <p className="text-[11px] text-slate-400 mb-1">Bajo (simplificado)</p>
    <div className="rounded-md bg-slate-900/90 p-2">{notes.join(' • ')}</div>
  </div>
)

const SongViewer: React.FC<SongViewerProps> = ({ title, tone, content }) => {
  const [instrument, setInstrument] = useState<Instrument>('guitar')
  const [activeChord, setActiveChord] = useState<string>('C')
  const notes = useMemo(() => getChordNotesFromSymbol(activeChord), [activeChord])
  return (
    <div className="p-4 text-slate-100">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-xs text-slate-400 mb-4">Tono: {tone}</p>
      <div className="flex gap-2 mb-3">
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('guitar')}>Guitarra</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('piano')}>Piano</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('bass')}>Bajo</button>
      </div>
      {instrument === 'guitar' && <GuitarDiagram chord={activeChord} />}
      {instrument === 'piano' && <PianoDiagram notes={notes} />}
      {instrument === 'bass' && <BassDiagram notes={notes} />}
      <div className="mt-4 text-sm whitespace-pre-wrap">{content}</div>
    </div>
  )
}

export default SongViewerimport React, {
  useEffect,
  useMemo,
  useRef,
  useState,
import React, { useMemo, useState } from 'react'

type Instrument = 'guitar' | 'piano' | 'bass'

type SongViewerProps = {
  title: string
  tone: string
  content: string
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

const GuitarDiagram: React.FC<{ chord: string }> = ({ chord }) => {
  const notes = getChordNotesFromSymbol(chord)
  return (
    <div className="mt-3 text-[11px]">
      <p className="text-slate-400 mb-1">Guitarra</p>
      <div className="border border-slate-600 bg-slate-100 rounded-lg px-3 py-3">
        {notes.join(' • ')}
      </div>
    </div>
  )
}

const PianoDiagram: React.FC<{ notes: string[] }> = ({ notes }) => (
  <div className="mt-3">
    <p className="text-[11px] text-slate-400 mb-1">Piano</p>
    <div className="rounded-md bg-slate-900/90 p-2">{notes.join(' • ')}</div>
  </div>
)

const BassDiagram: React.FC<{ notes: string[] }> = ({ notes }) => (
  <div className="mt-3">
    <p className="text-[11px] text-slate-400 mb-1">Bajo</p>
    <div className="rounded-md bg-slate-900/90 p-2">{notes.join(' • ')}</div>
  </div>
)

const SongViewer: React.FC<SongViewerProps> = ({ title, tone, content }) => {
  const [instrument, setInstrument] = useState<Instrument>('guitar')
  const [activeChord] = useState<string>('C')
  const notes = useMemo(() => getChordNotesFromSymbol(activeChord), [activeChord])
  return (
    <div className="p-4 text-slate-100">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-xs text-slate-400 mb-4">Tono: {tone}</p>
      <div className="flex gap-2 mb-3">
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('guitar')}>Guitarra</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('piano')}>Piano</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('bass')}>Bajo</button>
      </div>
      {instrument === 'guitar' && <GuitarDiagram chord={activeChord} />}
      {instrument === 'piano' && <PianoDiagram notes={notes} />}
      {instrument === 'bass' && <BassDiagram notes={notes} />}
      <div className="mt-4 text-sm whitespace-pre-wrap">{content}</div>
    </div>
  )
}

export default SongViewer
*/
import SongViewerFixed from './SongViewerFixed'
export default SongViewerFixed
  ],
  E7: [
    {
      frets: [0, 2, 0, 1, 0, 0],
      fingers: [null, 2, null, 1, null, null],
      name: 'E7',
    },
    {
      frets: [12, 14, 12, 13, 12, 12],
      fingers: [1, 3, 1, 2, 1, 1],
      name: 'E7 en 12º',
    },
  ],
  A7: [
    {
      frets: [-1, 0, 2, 0, 2, 0],
      fingers: [null, null, 2, null, 3, null],
      name: 'A7 abierto',
    },
  ],
  C7: [
    {
      frets: [-1, 3, 2, 3, 1, 0],
      fingers: [null, 3, 2, 4, 1, null],
      name: 'C7',
    },
  ],
  Asus4: [
    {
      frets: [-1, 0, 2, 2, 3, 0],
      fingers: [null, null, 1, 2, 3, null],
      name: 'Asus4',
    },
  ],
  Dsus2: [
    {
      frets: [-1, -1, 0, 2, 3, 0],
      fingers: [null, null, null, 1, 3, null],
      name: 'Dsus2',
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
          .replace(/maj7/, 'maj7')
          .replace(/m[^a-z]?/, 'm')
          .replace(/sus2|sus4/, (m)=>m)
          .replace(/add9/, 'add9')
          .replace(/7$/, '7')
          .replace(/aug|dim/, (m)=>m)
          .replace(/(maj7|m|sus2|sus4|add9|7|aug|dim).*$/, (m)=>m)
          .replace(/(C|D|E|F|G|A|B)[b]/, (m)=>{
            const map: Record<string,string> = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }
            return map[m] || m
          }),
      )
    ] ||
    null

  const [shapeIndex, setShapeIndex] = useState(0)

  if (!shapes || shapes.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 mt-2">
        Todavía no tenemos diagrama guardado para este acorde.
      </p>
    )
  }

  const shape = shapes[shapeIndex % shapes.length]
  const frets = shape.frets
  const fingers = shape.fingers

  const usedFrets = frets.filter(f => f > 0)
  const minFret = usedFrets.length ? Math.min(...usedFrets) : 1
  const maxFret = usedFrets.length ? Math.max(...usedFrets) : 5
  const baseFret = Math.min(minFret, 5)
  // Mostrar siempre 5 trastes para orientación tipo póster
  const totalFrets = 5

  const rows = Array.from({ length: totalFrets }, (_, i) => baseFret + i)

  // Detección de cejilla: mismo traste con dedo 1 en cuerdas contiguas
  type Barre = { fret: number; startString: number; endString: number }
  const detectBarre = (): Barre | null => {
    // recorrer de 6ª a 1ª; si hay dos o más cuerdas contiguas con mismo traste y finger 1
    let current: Barre | null = null
    for (let s = 0; s < frets.length; s++) {
      const f = frets[s]
      const finger = fingers[s]
      if (f > 0 && finger === 1) {
        if (!current) {
          current = { fret: f, startString: s, endString: s }
        } else if (current.fret === f && s === current.endString + 1) {
          current.endString = s
        } else if (current.endString - current.startString < 1) {
          // reiniciar si no era cejilla válida
          current = { fret: f, startString: s, endString: s }
        }
      }
    }
    if (current && current.endString - current.startString >= 1) return current
    return null
  }
  const barre = detectBarre()

  return (
    <div className="mt-3 text-[11px]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400">Posición: {shape.name ?? 'Forma'}</p>
        {shapes.length > 1 && (
          <div className="flex gap-1">
            <button onClick={()=>setShapeIndex(i=> (i-1+shapes.length)%shapes.length)} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">◀</button>
            <button onClick={()=>setShapeIndex(i=> (i+1)%shapes.length)} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">▶</button>
          </div>
        )}
      </div>

      {/* marcas arriba: X / O */}
      <div className="flex justify-between px-3 mb-1">
        {frets.map((f, i) => (
          <div
            key={i}
            className="w-6 text-center text-[11px] text-slate-300"
          >
            {f === -1 ? '×' : f === 0 ? '○' : ' '}
          </div>
        ))}
      </div>

      {/* diagrama */}
      <div className="border border-slate-600 bg-slate-900/80 rounded-lg px-3 py-2">
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
                  className="w-5 h-8 flex items-center justify-center border-l border-slate-700 last:border-r"
                >
                  {isDot ? (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-[10px] flex items-center justify-center text-slate-950 shadow">
                      {/* diagrama */}
                      <div className="relative border border-slate-600 bg-slate-100 rounded-lg px-3 py-3">
                        {/* líneas de trastes */}
                        {rows.map((fretNum, rIdx) => (
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
                                  className="w-6 h-10 flex items-center justify-center border-l border-slate-700 last:border-r"
                                >
                                  {isDot ? (
                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-[10px] flex items-center justify-center text-white shadow">
                                      {finger ?? ''}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                        {/* cejilla */}
                        {barre && (
                          <div
                            className="absolute rounded-full bg-slate-900"
                            style={{
                              top: ((barre.fret - baseFret) * 40) + 6,
                              left: (barre.startString * 24) + 12,
                              width: ((barre.endString - barre.startString + 1) * 24) - 4,
                              height: 12,
                            }}
                          />
                        )}
                        {/* etiqueta de traste base */}
                        <div className="absolute right-2 bottom-2 text-[10px] text-slate-700">traste {baseFret}</div>
                      </div>
      if (BLACK_SET.has(after)) {
        blacks.push({ note: after, isBlack: true, whiteIndex: whiteCounter })
      }
      whiteCounter++
    }
  }
  return { whites, blacks }
}

const PianoDiagram: React.FC<{ notes: string[]; inversionName?: string; inversionIndex?: number }> = ({ notes, inversionName, inversionIndex = 0 }) => {
  const degreeNotes = notes.map(n => normalizeNote(n))
  const { whites, blacks } = buildPianoLayout(2)

  // Solo iluminar una tecla por nota (no todas las repeticiones en octavas)
  const activeWhiteIndexByNote = new Map<string, number>()
  const activeBlackIndexByNote = new Map<string, number>()
  const getIndices = (arr: typeof whites | typeof blacks, note: string) =>
    arr.map((k, idx) => (k.note === note ? idx : -1)).filter(i => i >= 0)

  degreeNotes.forEach(n => {
    // elegir índice dependiente de la inversión para que "cambie de lugar" el color
    const wIdxs = getIndices(whites, n)
    const bIdxs = getIndices(blacks, n)
    if (wIdxs.length) {
      const pick = wIdxs[Math.min(inversionIndex, wIdxs.length - 1)]
      activeWhiteIndexByNote.set(n, pick)
    }
    if (bIdxs.length) {
      const pick = bIdxs[Math.min(inversionIndex, bIdxs.length - 1)]
      activeBlackIndexByNote.set(n, pick)
    }
  })

  const whiteWidth = 24
  const whiteHeight = 110
  const blackWidth = 16
  const blackHeight = 68

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-slate-400">Teclas activas</p>
        {inversionName && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">{inversionName}</span>
        )}
      </div>
      <div className="rounded-md bg-slate-900/90 p-3 overflow-x-auto">
        <div className="relative" style={{ width: whites.length * (whiteWidth + 2), height: whiteHeight, minWidth: '100%' }}>
          {/* Blancas */}
          {whites.map(w => {
            const isActive = activeWhiteIndexByNote.get(w.note) === whites.indexOf(w)
            return (
              <div
                key={`w-${w.whiteIndex}`}
                style={{
                  position: 'absolute',
                  left: (w.whiteIndex || 0) * (whiteWidth + 2),
                  top: 0,
                  width: whiteWidth,
                  height: whiteHeight,
                }}
                className={
                  'flex flex-col items-center justify-end text-[10px] rounded-sm border shadow-sm ' +
                  (isActive
                    ? 'border-teal-300 bg-teal-300 text-slate-950'
                    : 'border-slate-700 bg-white text-slate-700')
                }
              >
                {w.note}
              </div>
            )
          })}
          {/* Negras */}
          {blacks.map(b => {
            const isActive = activeBlackIndexByNote.get(b.note) === blacks.indexOf(b)
            return (
              <div
                key={`b-${b.whiteIndex}`}
                style={{
                  position: 'absolute',
                  left: ((b.whiteIndex || 0) * (whiteWidth + 2)) + whiteWidth - (blackWidth / 2),
                  top: 0,
                  width: blackWidth,
                  height: blackHeight,
                }}
                className={
                  'flex flex-col items-center justify-end text-[9px] rounded-sm border shadow-sm ' +
                  (isActive
                    ? 'border-teal-300 bg-teal-300 text-slate-950'
                    : 'border-slate-700 bg-slate-800 text-slate-200')
                }
              >
                {b.note}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* Bajo: diagrama tipo diapasón con 4 cuerdas y trastes 0-12; marca notas de la inversión */
const BassDiagram: React.FC<{ notes: string[]; inversionName?: string }> = ({ notes, inversionName }) => {
  const target = notes.map(n => normalizeNote(n))
  const strings = ['E', 'A', 'D', 'G'] // afinación estándar
  const frets = Array.from({ length: 13 }, (_, i) => i) // 0 a 12

  // calcula trastes donde aparece una nota en cada cuerda
  const noteToFretPositions = (openNote: string, wantedNotes: string[]) => {
    const positions: number[] = []
    const openIdx = NOTES_SHARP.indexOf(normalizeNote(openNote))
    if (openIdx === -1) return positions
    for (const wn of wantedNotes) {
      const wnIdx = NOTES_SHARP.indexOf(normalizeNote(wn))
      if (wnIdx === -1) continue
      let dist = wnIdx - openIdx
      if (dist < 0) dist += 12
      positions.push(dist)
    }
    return positions.filter(p => p >= 0 && p <= 12)
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-slate-400">Diapasón (0–12)</p>
        {inversionName && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">{inversionName}</span>
        )}
      </div>
      <div className="rounded-md bg-slate-900/90 p-2">
        {strings.map((s, rowIdx) => {
          const activeFrets = new Set(noteToFretPositions(s, target))
          return (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-slate-400 w-5">{s}</span>
              <div className="flex">
                {frets.map(f => (
                  <div
                    key={`${rowIdx}-${f}`}
                    className="w-6 h-8 flex items-center justify-center border-l border-slate-700 last:border-r"
                  >
                    {activeFrets.has(f) ? (
                      <div className="w-4 h-4 rounded-full bg-teal-400 shadow"></div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        <div className="flex justify-end gap-4 mt-2 text-[9px] text-slate-500">
          <span>3</span><span>5</span><span>7</span><span>9</span><span>12</span>
        </div>
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
  const inversions = useMemo(() => chordInversions(chord), [chord])
  const [invIndex, setInvIndex] = useState<number>(0)
  const currentInv = inversions[invIndex] || { name: 'Fundamental', notes }
  // Etiqueta pedagógica: mostrar patrón 1-3-5, 3-5-1, 5-1-3
  const invLabel = currentInv.name === 'Fundamental'
    ? 'Fundamental (1–3–5)'
    : currentInv.name.includes('1ª')
    ? '1ª inversión (3–5–1)'
    : currentInv.name.includes('2ª')
    ? '2ª inversión (5–1–3)'
    : currentInv.name
  const nextInv = () => setInvIndex(i => (inversions.length ? (i + 1) % inversions.length : 0))
  const prevInv = () => setInvIndex(i => (inversions.length ? (i - 1 + inversions.length) % inversions.length : 0))

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
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Notas ({invLabel})</p>
          <div className="flex gap-1">
            <button onClick={prevInv} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">◀</button>
            <button onClick={nextInv} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">▶</button>
          </div>
        </div>
        {currentInv.notes.length ? (
          <p className="text-[11px] text-teal-200 mt-1">
            {currentInv.notes.join(' • ')}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1">
            No pudimos analizar este acorde todavía.
          </p>
        )}
      </div>

      {instrument === 'guitar' && <GuitarDiagram chord={chord} />}

      {instrument === 'piano' && <PianoDiagram inversionIndex={invIndex} inversionName={currentInv.name} notes={currentInv.notes.length ? currentInv.notes : notes} />}

      {/* Lista de inversiones removida: se muestra solo la inversión activa con flechas */}

      {instrument === 'bass' && <BassDiagram inversionName={currentInv.name} notes={currentInv.notes.length ? currentInv.notes : notes} />}

      <button
        onClick={onClose}
        className="mt-3 w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1 text-[11px]"
      >
        Cerrar
      </button>
    </div>
  )
}

/* ==== SongViewer limpio y mínimo solo con instrumentos ==== */

const SongViewer: React.FC<SongViewerProps> = ({ title, tone, content }) => {
  const [instrument, setInstrument] = useState<Instrument>('guitar')
  const [activeChord] = useState<string>('C')
  const notes = useMemo(() => getChordNotesFromSymbol(activeChord), [activeChord])
  return (
    <div className="p-4 text-slate-100">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-xs text-slate-400 mb-4">Tono: {tone}</p>
      <div className="flex gap-2 mb-3">
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('guitar')}>Guitarra</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('piano')}>Piano</button>
        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[12px]" onClick={()=>setInstrument('bass')}>Bajo</button>
      </div>
      {instrument === 'guitar' && <GuitarDiagram chord={activeChord} />}
      {instrument === 'piano' && <PianoDiagram notes={notes} />}
      {instrument === 'bass' && <BassDiagram notes={notes} />}
      <div className="mt-4 text-sm whitespace-pre-wrap">{content}</div>
    </div>
  )
}
              .replace(/sus2|sus4/, (m)=>m)
              .replace(/add9/, 'add9')
              .replace(/7$/, '7')
              .replace(/aug|dim/, (m)=>m)
              .replace(/(maj7|m|sus2|sus4|add9|7|aug|dim).*$/, (m)=>m)
              .replace(/(C|D|E|F|G|A|B)[b]/, (m)=>{
                const map: Record<string,string> = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }
                return map[m] || m
              }),
          )
        ] ||
        null

      const [shapeIndex, setShapeIndex] = useState(0)

      if (!shapes || shapes.length === 0) {
        return (
          <p className="text-[11px] text-slate-400 mt-2">
            Todavía no tenemos diagrama guardado para este acorde.
          </p>
        )
      }

      const shape = shapes[shapeIndex % shapes.length]
      const frets = shape.frets
      const fingers = shape.fingers

      const usedFrets = frets.filter(f => f > 0)
      const minFret = usedFrets.length ? Math.min(...usedFrets) : 1
      const baseFret = Math.min(minFret, 5)
      const totalFrets = 5
      const rows = Array.from({ length: totalFrets }, (_, i) => baseFret + i)

      // cejilla simple: dedo 1 repetido en cuerdas contiguas mismo traste
      type Barre = { fret: number; startString: number; endString: number }
      let barre: Barre | null = null
      for (let s = 0; s < frets.length; s++) {
        const f = frets[s]
        const finger = fingers[s]
        if (f > 0 && finger === 1) {
          if (!barre) barre = { fret: f, startString: s, endString: s }
          else if (barre.fret === f && s === barre.endString + 1) barre.endString = s
        }
      }
      if (barre && barre.endString - barre.startString < 1) barre = null

      return (
        <div className="mt-3 text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-400">Posición: {shape.name ?? 'Forma'}</p>
            {shapes.length > 1 && (
              <div className="flex gap-1">
                <button onClick={()=>setShapeIndex(i=> (i-1+shapes.length)%shapes.length)} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">◀</button>
                <button onClick={()=>setShapeIndex(i=> (i+1)%shapes.length)} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">▶</button>
              </div>
            )}
          </div>

          {/* marcas arriba: X / O */}
          <div className="flex justify-between px-3 mb-1">
            {frets.map((f, i) => (
              <div key={i} className="w-6 text-center text-[11px] text-slate-300">
                {f === -1 ? '×' : f === 0 ? '○' : ' '}
              </div>
            ))}
          </div>

          {/* diagrama */}
          <div className="relative border border-slate-600 bg-slate-100 rounded-lg px-3 py-3">
            {rows.map(fretNum => (
              <div key={fretNum} className="flex justify-between items-center">
                {frets.map((f, stringIdx) => {
                  const isDot = f === fretNum
                  const finger = fingers[stringIdx]
                  return (
                    <div key={stringIdx} className="w-6 h-10 flex items-center justify-center border-l border-slate-700 last:border-r">
                      {isDot ? (
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-[10px] flex items-center justify-center text-white shadow">
                          {finger ?? ''}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ))}
            {barre && (
              <div
                className="absolute rounded-full bg-slate-900"
                style={{
                  top: ((barre.fret - baseFret) * 40) + 6,
                  left: (barre.startString * 24) + 12,
                  width: ((barre.endString - barre.startString + 1) * 24) - 4,
                  height: 12,
                }}
              />
            )}
            <div className="absolute right-2 bottom-2 text-[10px] text-slate-700">traste {baseFret}</div>
          </div>
        </div>
      )
    }
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
        transposeSteps?: number
        setTransposeSteps?: (v: number) => void
              className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 1))}
              className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"
            >
              A+
          </div>

        setInstrument?: (v: Instrument) => void
            <div className="flex gap-2">
              <button

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
                onClick={() => setTransposeSteps(Math.max(-12, transposeSteps - 1))}
                className="flex-1 rounded bg-slate-800 py-1 text-[11px]"
                disabled={
                  externalTranspose !== null &&
                  externalTranspose !== undefined
                }
              >
                - ½
              </button>
              <button
                onClick={() => setTransposeSteps(Math.min(12, transposeSteps + 1))}
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
                onClick={() => setMetronomeOn(!metronomeOn)}
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
          <button onClick={printSong} className="w-full rounded bg-slate-800 py-1 text-[11px]">
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

      {/* Recuadro abajo-izquierda removido según preferencia del usuario */}

      {/* botón flotante PDF eliminado para evitar duplicado de UI */}
    </div>
  )
}

export default SongViewer
