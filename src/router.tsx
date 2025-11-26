import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import ImportSongPage from './pages/ImportSongPage'
import LibraryPage from './pages/LibraryPage'
import FoldersPage from './pages/FoldersPage'
import FolderDetailPage from './pages/FolderDetailPage'
import LiveSessionPage from './pages/LiveSessionPage'
import SongPage from './pages/SongPage'
import LoginPage from './pages/LoginPage'

import { useAuth } from './hooks/useAuth'

type ProtectedProps = { children: React.ReactNode }

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-xs">Cargando sesión...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'import',
        element: <ImportSongPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'folders',
        element: <FoldersPage />,
      },
      {
        path: 'folders/:id',
        element: <FolderDetailPage />,
      },
      {
        path: 'live',
        element: <LiveSessionPage />,
      },
      {
        path: 'song/:id',
        element: <SongPage />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/app" replace />,
  },
])
