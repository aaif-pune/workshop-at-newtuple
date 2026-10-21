import Photo from './Photo'

/**
 * A content card. Works for products, recipes, events, people, anything with a picture and a title.
 * Props: image, alt, ratio, eyebrow, title, href, text, price, priceNote, badges (node),
 *        corner (node, top-right of the picture), actions (node, bottom).
 */
export default function Card({ image, alt, ratio, eyebrow, title, href, text, price, priceNote, badges, corner, actions, ...rest }) {
  const Title = href ? 'a' : 'span'
  return (
    <article className="w-card" {...rest}>
      <div className="w-card-media">
        {href ? <a href={href} tabIndex={-1} aria-hidden="true"><Photo src={image} alt="" ratio={ratio} /></a> : <Photo src={image} alt={alt || title} ratio={ratio} />}
        {corner && <div className="w-card-corner">{corner}</div>}
      </div>
      <div className="w-card-body">
        {eyebrow && <span className="w-eyebrow">{eyebrow}</span>}
        <h3 className="w-card-title"><Title href={href}>{title}</Title></h3>
        {text && <p className="w-card-text">{text}</p>}
        {(price != null || badges) && (
          <div className="w-card-meta">
            {price != null && <strong className="w-price">{price}{priceNote && <small>{priceNote}</small>}</strong>}
            {badges}
          </div>
        )}
        {actions && <div className="w-card-actions">{actions}</div>}
      </div>
    </article>
  )
}
