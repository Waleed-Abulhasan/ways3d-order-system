'use client'

import { useEffect, useState } from 'react'

interface LogoImageProps {
  className?: string
  style?: React.CSSProperties
  width?: number
  height?: number
}

export default function LogoImage({ className, style, width, height }: LogoImageProps) {
  const [src, setSrc] = useState('/logo-white.jpg')

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i] > 200 && data.data[i + 1] > 200 && data.data[i + 2] > 200) {
          data.data[i + 3] = 0
        }
      }
      ctx.putImageData(data, 0, 0)
      setSrc(canvas.toDataURL('image/png'))
    }
    img.src = '/logo-white.jpg'
  }, [])

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Ways3D" width={width} height={height} className={className} style={style} />
}
