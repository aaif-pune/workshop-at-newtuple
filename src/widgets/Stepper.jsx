import { Minus, Plus } from 'lucide-react'

/** Quantity control. Props: value, max, min (default 1), onChange(n), label. */
export default function Stepper({ value, max, min = 1, onChange, label = 'Quantity' }) {
  return (
    <div className="w-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}><Minus size={14} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}><Plus size={14} /></button>
    </div>
  )
}
