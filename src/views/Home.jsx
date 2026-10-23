import { api } from '../api'
import { useApi } from '../hooks'
import { CardGrid, FilterPanel, Hero, TileRow } from '../widgets'
import { Empty } from '../components'
import ProductCard from './ProductCard'

export const DEFAULT_FILTERS = { query: '', category: '', status: '', min_price: '', max_price: '', sort: 'relevance' }

export default function Home({ filters, setFilters, run, theme, products }) {
  const categories = useApi(api.categories, [], [])
  const all = useApi(() => api.searchProducts({}), [], [])
  const themed = theme.key !== 'default'
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS)
  const goShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  const active = Object.entries(filters).filter(([k, v]) => v && v !== DEFAULT_FILTERS[k] && k !== 'sort')

  const fields = [
    { type: 'radio', key: 'category', label: 'Category', options: [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))] },
    { type: 'radio', key: 'status', label: 'Availability', options: [{ value: '', label: 'Any' }, { value: 'in_stock', label: 'In stock' }, { value: 'low_stock', label: 'Low stock' }, { value: 'out_of_stock', label: 'Out of stock' }] },
    { type: 'range', label: 'Price (₹)', keys: ['min_price', 'max_price'], placeholders: ['Min', 'Max'] },
  ]
  const tiles = categories.map((c) => ({
    label: c, image: all.find((p) => p.category === c)?.image, note: all.filter((p) => p.category === c).length + ' items',
    onClick: () => { setFilters({ ...DEFAULT_FILTERS, category: c }); setTimeout(goShop, 50) },
  }))

  return (
    <>
      <Hero title={theme.hero.title} text={theme.hero.sub} image={theme.hero.image} action={{ label: themed ? 'See the range' : 'Start shopping', onClick: goShop }} />
      {isDefault && !themed && <section className="home-tiles"><h2>Shop by category</h2><TileRow items={tiles} /></section>}

      <div className="shop" id="shop">
        <FilterPanel fields={fields} values={filters} onChange={(v) => setFilters({ ...filters, ...v })} onClear={() => setFilters(DEFAULT_FILTERS)} />
        <section>
          <div className="toolbar">
            <div>
              <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}{filters.query && <> matching “{filters.query}”</>}
              <div className="chips">
                {active.map(([k, v]) => <button key={k} className="chip" onClick={() => setFilters({ ...filters, [k]: '' })}>{String(v).replace('_', ' ')} ×</button>)}
              </div>
            </div>
            <label className="inline">Sort
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                <option value="relevance">Featured</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          {products.length === 0 ? <Empty>Nothing matches. Try removing a filter.</Empty> : (
            <CardGrid min={230}>{products.map((p) => <ProductCard key={p.id} p={p} run={run} />)}</CardGrid>
          )}
        </section>
      </div>
    </>
  )
}
