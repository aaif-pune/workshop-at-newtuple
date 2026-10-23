import { useState } from 'react'
import { api } from '../api'
import { useApi } from '../hooks'
import { DataTable, Photo, Stat, StatRow } from '../widgets'
import { DemandBadge, StockBadge } from '../components'

function Restock({ r, run }) {
  const [qty, setQty] = useState(10)
  return (
    <div className="restock">
      <input type="number" min="1" value={qty} aria-label={`Units to add for ${r.sku}`} onChange={(e) => setQty(Number(e.target.value) || 1)} />
      <button className="w-btn primary" onClick={() => run(() => api.restock(r.id, qty), 'Stock added')}>Add stock</button>
    </div>
  )
}

function AddProduct({ run }) {
  const blank = { name: '', category: '', description: '', image: '', label: '', price: '', quantity: '' }
  const [f, setF] = useState(blank)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const r = await run(() => api.addProduct({ name: f.name, category: f.category, description: f.description, image: f.image, variants: [{ label: f.label, price: f.price, quantity: f.quantity }] }), 'Product added')
    if (r) setF(blank)
  }
  return (
    <details className="card addproduct">
      <summary>Add a new product</summary>
      <form onSubmit={submit} className="addgrid">
        <label className="field">Name<input value={f.name} onChange={set('name')} required /></label>
        <label className="field">Category<input value={f.category} onChange={set('category')} list="cats" required /></label>
        <datalist id="cats">{['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports & Fitness', 'Books', 'Toys & Games', 'Grocery'].map((c) => <option key={c} value={c} />)}</datalist>
        <label className="field wide">Description<input value={f.description} onChange={set('description')} /></label>
        <label className="field wide">Photo URL (optional)<input type="url" placeholder="https://…" value={f.image} onChange={set('image')} /></label>
        <label className="field">Variant label<input value={f.label} onChange={set('label')} required /></label>
        <label className="field">Price ₹<input type="number" min="1" value={f.price} onChange={set('price')} required /></label>
        <label className="field">Opening stock<input type="number" min="0" value={f.quantity} onChange={set('quantity')} required /></label>
        <button className="w-btn primary" type="submit">Add product</button>
      </form>
    </details>
  )
}

export default function Inventory({ run }) {
  const [filter, setFilter] = useState('all')
  const rows = useApi(() => api.getInventory({ filter }), [filter], [])
  const all = useApi(() => api.getInventory({}), [], [])
  const columns = [
    { key: 'product', header: 'Product', render: (r) => (
      <div className="prodcell"><Photo src={r.image} alt="" w={96} ratio="1/1" className="thumb" /><div>{r.product_name}<div className="sub">{r.sku} · {r.label}</div></div></div>) },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Qty', align: 'right' },
    { key: 'status', header: 'Status', render: (r) => <StockBadge v={r} /> },
    { key: 'demand', header: 'Demand', render: (r) => (r.high_demand ? <><DemandBadge /> <span className="sub">{r.pending_notifications} waiting</span></> : <span className="sub">Normal</span>) },
    { key: 'restock', header: 'Restock', render: (r) => <Restock r={r} run={run} /> },
  ]
  return (
    <section className="page wide">
      <div className="row head">
        <h1>Inventory management <span className="sub">admin</span></h1>
        <label className="inline">Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All variants</option>
            <option value="needs_attention">Needs attention</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="low_stock">Low stock</option>
            <option value="high_demand">High demand</option>
          </select>
        </label>
      </div>
      <StatRow>
        <Stat label="Variants" value={all.length} />
        <Stat label="Out of stock" value={all.filter((r) => r.status === 'out_of_stock').length} />
        <Stat label="Low stock" value={all.filter((r) => r.status === 'low_stock').length} />
        <Stat label="High demand" value={all.filter((r) => r.high_demand).length} hint="Customers waiting for a restock" />
      </StatRow>
      <AddProduct run={run} />
      <DataTable columns={columns} rows={rows} rowKey="id" empty="Nothing here." />
    </section>
  )
}
