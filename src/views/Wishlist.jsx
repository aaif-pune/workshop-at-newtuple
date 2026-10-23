import { api } from '../api'
import { useApi } from '../hooks'
import { navigate } from '../router'
import { ListRow } from '../widgets'
import { DemandBadge, Empty, StockBadge, money } from '../components'

export default function Wishlist({ run }) {
  const items = useApi(api.getWishlist, [], [])
  return (
    <section className="page">
      <h1>Wishlist <span className="sub">({items.length})</span></h1>
      {items.length === 0 ? <Empty>Nothing saved yet. Tap the heart on any product.</Empty> : (
        <div className="list">
          {items.map((i) => (
            <ListRow key={i.id} image={i.image} title={i.product_name} href={'#/product/' + i.product_id}
              meta={`${i.label} · ${i.sku}`}
              badges={<><StockBadge v={i} />{i.high_demand && <DemandBadge />}</>}
              right={<strong>{money(i.price)}</strong>}
              actions={<>
                {i.quantity > 0
                  ? <button className="w-btn primary" onClick={async () => { if (await run(() => api.addToCart(i.id, 1), 'Added to cart')) navigate('/cart') }}>Add to cart</button>
                  : <button className="w-btn primary" disabled={i.pending_notifications > 0} onClick={() => run(() => api.notifyWhenAvailable(i.id), "We'll notify you")}>{i.pending_notifications > 0 ? 'Notification set' : 'Notify me'}</button>}
                <button className="w-btn ghost" onClick={() => run(() => api.removeFromWishlist(i.id))}>Remove</button>
              </>} />
          ))}
        </div>
      )}
    </section>
  )
}
