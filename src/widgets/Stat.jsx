/** A number with a label. Props: label, value, hint. StatRow lays several out. */
export function Stat({ label, value, hint }) {
  return <div className="w-stat"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>
}
export const StatRow = ({ children }) => <div className="w-statrow">{children}</div>
