import { useEffect, useState } from 'react'

// Tiny hash router: #/  #/product/3  #/cart  #/checkout  #/wishlist  #/orders  #/admin
const read = () => location.hash.replace(/^#/, '') || '/'
export const navigate = (path) => { location.hash = path; window.scrollTo({ top: 0 }) }
export function useRoute() {
  const [path, setPath] = useState(read)
  useEffect(() => {
    const h = () => setPath(read())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  const [route, query = ''] = path.split('?')
  const [, a, b] = route.split('/')
  return { path, page: a || 'home', id: b ? Number(b) : null, params: new URLSearchParams(query) }
}
