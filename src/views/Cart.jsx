import { Trash2 } from 'lucide-react'
import { api } from '../api'
import { useApi } from '../hooks'
import { ListRow, Stepper } from '../widgets'
import { Empty, money } from '../components'

export function Summary({ cart, children }) {
  return (
    <aside className="summary card">
      <h2>Order summary</h2>
      <div className="row"><span>Items ({cart.item_count})</span><span>{money(cart.total)}</span></div>
      <div className="row"><span>Delivery</span><span className="good">Free</span></div>
      <div className="row totalrow"><span>Total</span><strong>{money(cart.total)}</strong></div>
      {children}
    </aside>
  )
}

export default function Cart({ run }) {
  const cart = useApi(api.getCart, [], { items: [], total: 0, item_count: 0 })
  return (
    <section className="page">
      <h1>Your cart</h1>
      {cart.items.length === 0 ? <Empty>Your cart is empty. <a href="#/">Keep shopping</a></Empty> : (
        <div className="two">
          <div className="list">
            {cart.items.map((i) => (
              <ListRow key={i.variant_id} image={i.image} title={i.product_name} href={'#/product/' + i.product_id}
                meta={<>{i.label} · {money(i.price)} each{i.available <= 5 && <span className="warn"> · only {i.available} left</span>}</>}
                right={<>
                  <Stepper value={i.quantity} max={i.available} label={`Quantity of ${i.sku}`} onChange={(n) => run(() => api.setCartQuantity(i.variant_id, n))} />
                  <strong className="linetotal">{money(i.subtotal)}</strong>
                </>}
                actions={<button className="icon" aria-label={`Remove ${i.product_name}`} onClick={() => run(() => api.removeFromCart(i.variant_id))}><Trash2 size={18} /></button>} />
            ))}
          </div>
          <Summary cart={cart}><a className="w-btn primary lg block" href="#/checkout">Go to checkout</a></Summary>
        </div>
      )}
    </section>
  )
}
