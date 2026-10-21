/** Small status pill. Props: tone = neutral | good | warn | bad | accent, icon (node). */
export default function Badge({ tone = 'neutral', icon, children }) {
  return <span className={'w-badge ' + tone}>{icon}{children}</span>
}
