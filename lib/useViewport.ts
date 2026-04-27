'use client'

import { useState, useEffect } from 'react'

export type Viewport = 'mobile' | 'tablet' | 'desktop'

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>('desktop')

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 768) setVp('mobile')
      else if (w < 1024) setVp('tablet')
      else setVp('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return vp
}