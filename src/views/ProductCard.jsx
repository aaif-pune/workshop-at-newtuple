import { Heart } from 'lucide-react'
import { api } from '../api'
import { navigate } from '../router'
import { Badge, Card } from '../widgets'
import { money } from '../components'

// The store's product card is just the generic <Card> filled with product data.
export default function ProductCard({ p, run }) {
  const v = p.variants.find((x) => x.quantity > 0) || p.variants[0]
  const multi = p.variants.length > 1
  const stock = p.status === 'out_of_stock' ? <Badge tone="bad">Out of stock</Badge> : p.status === 'low_stock' ? <Badge tone="warn">Few left</Badge> : null

  let action
  if (multi) action = <button className="w-btn outline block" onClick={() => navigate('/product/' + p.id)}>Choose option</button>
  else if (v.quantity > 0) action = <button className="w-btn primary block" onClick={() => run(() => api.addToCart(v.id, 1), 'Added to cart')}>Add to cart</button>
  else action = <button className="w-btn outline block" disabled>Out of stock</button>

  return (
    <Card
      data-product-id={p.id}
      image={p.image} alt={p.name} ratio="var(--img-ratio)" href={'#/product/' + p.id}
      eyebrow={p.category} title={p.name}
      price={(multi ? 'From ' : '') + money(p.price_from)}
      badges={stock}
      corner={
        <button className={'w-heart' + (v.wishlisted ? ' on' : '')} aria-label={v.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() => run(() => (v.wishlisted ? api.removeFromWishlist(v.id) : api.addToWishlist(v.id)), v.wishlisted ? '' : 'Saved to wishlist')}>
          <Heart size={17} fill={v.wishlisted ? 'currentColor' : 'none'} />
        </button>
      }
      actions={action}
    />
  )
}
