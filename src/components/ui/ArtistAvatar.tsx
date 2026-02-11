import React, { useEffect, useState } from 'react'
import { resolveArtistImageUrl } from '../../lib/artistResolver'

type Props = {
  author?: string | null
  sizeClassName?: string
}

const ArtistAvatar: React.FC<Props> = ({ author, sizeClassName = 'w-8 h-8' }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!author?.trim()) {
        setImageUrl(null)
        return
      }
      const url = await resolveArtistImageUrl(author)
      if (!cancelled) setImageUrl(url)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [author])

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={author || 'Artista'}
        className={`${sizeClassName} rounded-md object-cover border border-slate-700/90 flex-shrink-0`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <div
      className={`${sizeClassName} rounded-md flex items-center justify-center border border-slate-700/90 bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex-shrink-0`}
      aria-hidden="true"
    >
      <span className="text-[10px] font-bold text-slate-200">S</span>
    </div>
  )
}

export default ArtistAvatar

