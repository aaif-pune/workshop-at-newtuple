import { Bell, CheckCheck, PackageCheck, PackagePlus, Boxes } from 'lucide-react'
import { api } from './api'
import { navigate } from './router'
import { NotificationList } from './widgets'

const ICON = { restock: Boxes, new_product: PackagePlus, order: PackageCheck }
const ago = (iso) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000))
  return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : new Date(iso).toLocaleDateString()
}
const target = (n) => (n.type === 'order' ? '/orders' : n.product_id ? '/product/' + n.product_id : null)
export const openNotification = (n) => {
  api.markRead(n.id)
  const t = target(n)
  if (t) navigate(t)
}
const view = (n) => { const Icon = ICON[n.type] || Bell; return { ...n, time: ago(n.created_at), icon: <Icon size={18} /> } }

export function Bell_({ items, open, setOpen }) {
  const unread = items.filter((n) => !n.read).length
  return (
    <div className="bellwrap">
      <button className="bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bell size={19} /><span>Alerts</span>{unread > 0 && <b>{unread}</b>}
      </button>
      {open && (
        <div className="inbox" role="dialog" aria-label="Notifications">
          <div className="inboxhead">
            <strong>Notifications</strong>
            <button className="linkbtn" onClick={() => api.markRead()}><CheckCheck size={14} /> Mark all read</button>
          </div>
          <NotificationList items={items.map(view)} onOpen={(n) => { openNotification(n); setOpen(false) }} empty="You are all caught up. Back-in-stock alerts show up here." />
        </div>
      )}
    </div>
  )
}

// Card for a notification that just arrived.
export function Popups({ items, dismiss }) {
  return (
    <div className="popups" aria-live="polite">
      {items.map((n) => (
        <div className="popup" key={n.id} role="status">
          <NotificationList items={[{ ...view(n), read: true, time: undefined }]} onOpen={(x) => { openNotification(x); dismiss(n.id) }} />
          <button className="x" aria-label="Dismiss notification" onClick={() => dismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
