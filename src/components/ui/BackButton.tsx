import React from 'react'
import { useNavigate } from 'react-router-dom'

const BackButton: React.FC = () => {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="btn btn-muted gap-2"
    >
      <span>←</span>
      <span>Volver</span>
    </button>
  )
}

export default BackButton
