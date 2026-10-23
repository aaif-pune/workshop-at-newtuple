// "Product information": the listing's facts in groups (Measurements, Style, Materials & Care,
// Features & Specs, Item details). Used on the product page (with a title) and in the AI view.
import { productInformation } from '../services/aeo'

export default function ProductInfo({ product, title }) {
  const groups = productInformation(product)
  if (!groups.length) return null
  const body = (
    <div className="pinfo-groups">
      {groups.map((g) => (
        <details key={g.title} open>
          <summary>{g.title}</summary>
          <table><tbody>{g.rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
        </details>
      ))}
    </div>
  )
  return title ? <section className="specs"><h2>{title}</h2>{body}</section> : body
}
