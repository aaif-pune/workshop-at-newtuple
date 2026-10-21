import Photo from './Photo'

/** One row in a list (cart line, wishlist item, event, task...). Props: image, title, href, meta (node), badges (node), right (node), actions (node). */
export default function ListRow({ image, title, href, meta, badges, right, actions }) {
  const Title = href ? 'a' : 'span'
  return (
    <div className="w-row">
      {image !== undefined && <Photo src={image} alt="" w={160} ratio="1/1" className="w-row-img" />}
      <div className="w-row-main">
        <strong><Title href={href}>{title}</Title></strong>
        {meta && <div className="w-row-meta">{meta}</div>}
        {badges && <div className="w-row-badges">{badges}</div>}
      </div>
      {right && <div className="w-row-right">{right}</div>}
      {actions && <div className="w-row-actions">{actions}</div>}
    </div>
  )
}
