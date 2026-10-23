/** A list of messages. Props: items = [{ id, title, message, time, read, icon }], onOpen(item), empty (text). */
export default function NotificationList({ items, onOpen, empty = 'Nothing new.' }) {
  if (!items.length) return <p className="w-notif-empty">{empty}</p>
  return (
    <ul className="w-notifs">
      {items.map((n) => (
        <li key={n.id}>
          <button className={'w-notif' + (n.read ? '' : ' unread')} onClick={() => onOpen?.(n)}>
            {n.icon && <span className="w-notif-icon">{n.icon}</span>}
            <span className="w-notif-text"><strong>{n.title}</strong><span>{n.message}</span>{n.time && <small>{n.time}</small>}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
