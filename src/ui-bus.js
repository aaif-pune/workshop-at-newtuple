// Lets WebMCP tools steer the visible UI (switch view, set filters) so people
// can watch the agent work.
const bus = new EventTarget()
export const showInUI = (detail) => bus.dispatchEvent(new CustomEvent('ui', { detail }))
export const onUIRequest = (fn) => {
  const h = (e) => fn(e.detail)
  bus.addEventListener('ui', h)
  return () => bus.removeEventListener('ui', h)
}
