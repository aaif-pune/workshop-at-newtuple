import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Horizontal scroller with arrow buttons. Props: title, children (any items; give them a fixed width in CSS or inline). */
export default function Carousel({ title, children }) {
  const ref = useRef(null)
  const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <section className="w-carousel">
      <div className="w-carousel-head">
        {title && <h2>{title}</h2>}
        <div>
          <button aria-label="Scroll left" onClick={() => go(-1)}><ChevronLeft size={18} /></button>
          <button aria-label="Scroll right" onClick={() => go(1)}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="w-carousel-track" ref={ref}>{children}</div>
    </section>
  )
}
