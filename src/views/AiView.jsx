// Session 4: what an AI agent reads on this page (the "function"), next to the
// normal page (the "flavour"). Shows the audit score and the raw facts.
import { api } from '../api'
import { useApi } from '../hooks'
import { label } from '../services/aeo'
import { Badge } from '../widgets'
import { Empty } from '../components'
import ProductInfo from './ProductInfo'

export default function AiView({ id, ai }) {
  const audit = useApi(() => api.auditAeo(id).catch((e) => ({ error: e.message })), [id], null)
  if (!ai || !audit) return null
  if (audit.error) return <Empty>The AI view could not be loaded: {audit.error}</Empty>
  const empty = <span className="ai-empty">Nothing here</span>
  const sized = (text, max) => (text ? <p>{text} <small className={'ai-len' + (text.length > max ? ' over' : '')}>{text.length}/{max}</small></p> : empty)
  const gaps = audit.product_information.filter((g) => g.missing.length)
  return (
    <div className="aiview">
      <div className="ai-score">
        <div className="ai-score-num"><strong>{audit.score}</strong>/{audit.max}</div>
        <div>
          <h2>AI readiness</h2>
          <p>This is what an AI agent can read about <strong>{ai.name}</strong>{ai.seller ? ` from ${ai.seller}` : ''}.
            {audit.compared_with.length > 0 && <> Compared with {audit.compared_with.map((c) => c.seller || c.name).join(', ')}.</>}</p>
        </div>
      </div>
      <ul className="ai-checks">
        {audit.checks.map((c) => (
          <li key={c.id}>
            <Badge tone={c.pass ? 'good' : 'bad'}>{c.pass ? 'Pass' : 'Missing'}</Badge> <strong>{c.label}</strong>
            {!c.pass && <div className="ai-fix">{c.fix}</div>}
          </li>
        ))}
      </ul>
      {gaps.length > 0 && (
        <div className="ai-gaps">
          <h3>Product information gaps</h3>
          <p>Facts other sellers publish (or every listing should have) that an AI cannot find here:</p>
          <ul>{gaps.map((g) => <li key={g.group}><strong>{g.group}:</strong> {g.missing.map(label).join(', ')}</li>)}</ul>
        </div>
      )}
      <div className="ai-read">
        <h3>In short</h3>{ai.in_short ? <p>{ai.in_short}</p> : empty}
        <h3>Best for</h3>{ai.best_for.length ? <p>{ai.best_for.join(', ')}</p> : empty}
        <h3>About this item</h3>{ai.about.length ? <ul>{ai.about.map((t) => <li key={t}>{t}</li>)}</ul> : empty}
        <h3>Key facts</h3>
        {Object.keys(ai.facts || {}).length ? <ProductInfo product={{ specs: ai.facts, seller: ai.seller, aeo: { best_for: ai.best_for } }} /> : empty}
        <h3>FAQs</h3>{ai.faqs.length ? <dl>{ai.faqs.map((f) => <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl> : empty}
        <h3>SEO title</h3>{sized(ai.seo_title, audit.rules.seo_title_max_chars)}
        <h3>Meta description</h3>{sized(ai.meta_description, audit.rules.meta_description_max_chars)}
        <details><summary>Structured data (schema.org JSON-LD)</summary><pre>{JSON.stringify(ai.json_ld, null, 2)}</pre></details>
      </div>
    </div>
  )
}
