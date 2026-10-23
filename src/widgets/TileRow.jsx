import Photo from './Photo'

/** A row of picture tiles (categories, collections, authors...). Props: items = [{ key, label, image, note, onClick }]. */
export default function TileRow({ items }) {
  return (
    <div className="w-tiles">
      {items.map((t) => (
        <button key={t.key ?? t.label} className="w-tile" onClick={t.onClick}>
          <Photo src={t.image} alt="" w={400} ratio="4/5" />
          <span className="w-tile-label">{t.label}{t.note && <small>{t.note}</small>}</span>
        </button>
      ))}
    </div>
  )
}
