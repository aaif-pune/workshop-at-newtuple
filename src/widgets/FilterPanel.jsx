import { useState } from 'react'

/**
 * Filters described as data, so the same panel filters products, recipes, tickets...
 * fields = [
 *   { type: 'radio', key: 'category', label: 'Category', options: [{ value: '', label: 'All' }, ...] },
 *   { type: 'range', label: 'Price', keys: ['min', 'max'], placeholders: ['Min', 'Max'] },
 *   { type: 'text',  key: 'q', label: 'Search' },
 * ]
 * values = { category: '', min: '', max: '', q: '' }   onChange(nextValues)   onClear()
 */
export default function FilterPanel({ title = 'Filters', fields, values, onChange, onClear }) {
  // Open on wide screens, folded on phones.
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 901px)').matches)
  const set = (patch) => onChange({ ...values, ...patch })
  return (
    <aside className="w-filters" aria-label={title}>
      <button type="button" className="w-filters-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{title}<span>{open ? '−' : '+'}</span></button>
      {open && <>
      {fields.map((f) => (
        <fieldset key={f.key || f.keys.join()}>
          <legend>{f.label}</legend>
          {f.type === 'radio' && f.options.map((o) => (
            <label key={o.value} className="w-radio">
              <input type="radio" name={f.key} checked={values[f.key] === o.value} onChange={() => set({ [f.key]: o.value })} />{o.label}
            </label>
          ))}
          {f.type === 'range' && (
            <div className="w-pair">
              {f.keys.map((k, i) => <input key={k} type="number" min="0" placeholder={f.placeholders?.[i]} aria-label={`${f.label} ${f.placeholders?.[i] || k}`} value={values[k]} onChange={(e) => set({ [k]: e.target.value })} />)}
            </div>
          )}
          {f.type === 'text' && <input type="search" value={values[f.key]} onChange={(e) => set({ [f.key]: e.target.value })} placeholder={f.placeholder} />}
        </fieldset>
      ))}
      {onClear && <button className="w-btn outline" onClick={onClear}>Clear all</button>}
      </>}
    </aside>
  )
}
