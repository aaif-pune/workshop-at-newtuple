import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

// Unsplash links are resized by query string; any other URL is used as-is.
export const photoUrl = (src, w = 600) =>
  src && src.includes('images.unsplash.com') ? `${src.split('?')[0]}?w=${w}&q=70&auto=format&fit=crop` : src

/** An image that never leaves a broken-image icon behind. Props: src, alt, w (px, for resizing), ratio ("4/3"), className. */
export default function Photo({ src, alt = '', w = 600, ratio, className = '' }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  const style = ratio ? { aspectRatio: ratio } : undefined
  if (!src || bad) return <div className={'w-photo w-photo-empty ' + className} style={style} role="img" aria-label={alt}><ImageIcon strokeWidth={1.2} /></div>
  return (
    <img className={'w-photo ' + className} style={style} src={photoUrl(src, w)} srcSet={src.includes('images.unsplash.com') ? `${photoUrl(src, w)} 1x, ${photoUrl(src, w * 2)} 2x` : undefined}
      alt={alt} loading="lazy" onError={() => setBad(true)} />
  )
}
