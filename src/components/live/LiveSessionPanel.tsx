import React, { useState } from 'react'

type Role = 'admin' | 'listener'

type Props = {
  role: Role
  onCreateSession: () => void
  onJoinSession: (code: string) => void
}

const LiveSessionPanel: React.FC<Props> = ({ role, onCreateSession, onJoinSession }) => {
  const [code, setCode] = useState('')

  if (role === 'admin') {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 space-y-3">
        <h2 className="text-sm font-semibold mb-2">Administrador</h2>
        <p className="text-xs text-slate-400 mb-3">
          Crea una sala en vivo, selecciona una carpeta y controla el tono y la letra para todos los oyentes en tiempo real.
        </p>
        <button
          onClick={onCreateSession}
          className="rounded-lg bg-holysong.primary px-5 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Crear nueva sala
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 space-y-3">
      <h2 className="text-sm font-semibold mb-2">Oyente</h2>
      <p className="text-xs text-slate-400 mb-3">
        Uníte a una sesión en vivo ingresando el código que te compartió el administrador.
      </p>
      <div className="flex gap-3">
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Código de la sala"
          className="flex-1 rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm"
        />
        <button
          onClick={() => onJoinSession(code)}
          className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700"
        >
          Unirse
        </button>
      </div>
    </div>
  )
}

export default LiveSessionPanel
