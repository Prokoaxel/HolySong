import React, { useEffect, useState } from 'react'
import DesktopAppLayout from './DesktopAppLayout'
import MobileAppLayout from './MobileAppLayout'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

const detectMobile = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

const AppLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(detectMobile())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(MOBILE_MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    setIsMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isMobile ? <MobileAppLayout /> : <DesktopAppLayout />
}

export default AppLayout
