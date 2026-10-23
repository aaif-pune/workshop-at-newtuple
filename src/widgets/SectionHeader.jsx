/** Heading for a block of content. Props: title, sub, action (node). */
export default function SectionHeader({ title, sub, action }) {
  return (
    <div className="w-section-head">
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {action}
    </div>
  )
}
