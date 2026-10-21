import { CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import { useApi } from '../hooks'
import { Empty, money } from '../components'

export default function Orders({ placed }) {
  const orders = useApi(api.getOrders, [], [])
  return (
    <section className="page">
      {placed && <div className="success" role="status"><CheckCircle2 /> <div><strong>Order {placed} placed!</strong><div className="sub">A confirmation would be emailed to you. Thank you for shopping with ShopWave.</div></div></div>}
      <h1>Your orders</h1>
      {orders.length === 0 ? <Empty>No orders yet. <a href="#/">Start shopping</a></Empty> : orders.map((o) => (
        <div className={'card order' + (o.id === placed ? ' new' : '')} key={o.id}>
          <div className="row"><strong>{o.id}</strong><span className="w-badge good">{o.status}</span><span className="sub">{new Date(o.created_at).toLocaleString()}</span></div>
          {o.items.map((i) => <div className="row" key={i.variant_id}><span>{i.quantity} × {i.product_name} ({i.label})</span><span>{money(i.subtotal)}</span></div>)}
          <div className="row totalrow"><span>Total</span><strong>{money(o.total)}</strong></div>
          <p className="sub">Ship to {o.customer.name}, {o.customer.address}, {o.customer.city} {o.customer.postal_code} · {o.customer.email} · {o.customer.phone}</p>
        </div>
      ))}
    </section>
  )
}
