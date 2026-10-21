import { useState } from 'react'
import { api } from '../api'
import { useApi } from '../hooks'
import { navigate } from '../router'
import { Empty, money } from '../components'
import { Summary } from './Cart'

const FIELDS = [
  ['name', 'Full name', 'text', 'name', 'wide'], ['email', 'Email', 'email', 'email'], ['phone', 'Phone', 'tel', 'tel'],
  ['address', 'Street address', 'text', 'street-address', 'wide'], ['city', 'City', 'text', 'address-level2'], ['postal_code', 'Postal code', 'text', 'postal-code'],
]
const blank = Object.fromEntries(FIELDS.map(([k]) => [k, '']))

export default function Checkout() {
  const cart = useApi(api.getCart, [], { items: [], total: 0, item_count: 0 })
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (cart.items.length === 0) return <section className="page"><Empty>Your cart is empty. <a href="#/">Continue shopping</a></Empty></section>

  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const o = await api.placeOrder(form); setError(''); setForm(blank); navigate('/orders?placed=' + o.id) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <section className="page">
      <h1>Checkout</h1>
      <div className="two">
        <form onSubmit={submit} className="card" noValidate aria-label="Delivery details">
          <h2>Delivery details</h2>
          <div className="formgrid">
            {FIELDS.map(([k, label, type, ac, w]) => (
              <label className={'field ' + (w || '')} key={k}>{label}
                <input name={k} type={type} autoComplete={ac} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <h2>Payment</h2>
          <p className="sub">Demo store: no payment is taken. Orders are saved in this browser.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="w-btn primary lg" type="submit" disabled={busy}>Place order · {money(cart.total)}</button>
        </form>
        <Summary cart={cart}>
          <ul className="mini">{cart.items.map((i) => <li key={i.variant_id}><span>{i.quantity} × {i.product_name} ({i.label})</span><span>{money(i.subtotal)}</span></li>)}</ul>
        </Summary>
      </div>
    </section>
  )
}
