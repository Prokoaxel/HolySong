import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ToastType = 'info' | 'success' | 'error'

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const typeClassMap: Record<ToastType, string> = {
  info: 'border-slate-600 bg-slate-900/95 text-slate-100',
  success: 'border-teal-500/60 bg-teal-950/90 text-teal-100',
  error: 'border-red-500/60 bg-red-950/90 text-red-100',
}

const detectType = (message: string): ToastType => {
  const msg = message.toLowerCase()
  if (msg.includes('error') || msg.includes('no se pudo') || msg.includes('fall') || msg.includes('deb')) {
    return 'error'
  }
  if (msg.includes('ok') || msg.includes('correct') || msg.includes('guardad') || msg.includes('agregad')) {
    return 'success'
  }
  return 'info'
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type?: ToastType) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const toastType = type ?? detectType(message)
    setToasts(prev => [...prev, { id, message, type: toastType }])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  useEffect(() => {
    const originalAlert = window.alert
    window.alert = (message?: string) => {
      showToast(String(message ?? ''))
    }
    return () => {
      window.alert = originalAlert
    }
  }, [showToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-3 right-3 z-[9999] w-[min(92vw,28rem)] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-xl border px-3 py-2 text-xs shadow-xl animate-[fadeIn_160ms_ease] ${typeClassMap[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
