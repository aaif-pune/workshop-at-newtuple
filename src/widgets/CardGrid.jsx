/** Responsive grid. Props: min (smallest column width in px, default 220), gap. Children: anything, usually <Card>. */
export default function CardGrid({ min = 220, gap = 20, children }) {
  return <div className="w-grid" style={{ '--min': min + 'px', '--gap': gap + 'px' }}>{children}</div>
}
