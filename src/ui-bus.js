// Lets code outside the React tree steer the visible UI (switch view, set filters,
// open the inbox). Used by add-ons such as agent/webmcp so people can watch an agent work.
const bus = new EventTarget()
export const showInUI = (detail) => bus.dispatchEvent(new CustomEvent('ui', { detail }))
export const onUIRequest = (fn) => {
  const h = (e) => fn(e.detail)
  bus.addEventListener('ui', h)
  return () => bus.removeEventListener('ui', h)
}
