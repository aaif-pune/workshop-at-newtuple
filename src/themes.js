// Category themes: when someone browses a category the whole store changes colours, shapes
// and hero. Tokens live in style.css under [data-theme="<key>"].
const u = (id) => `https://images.unsplash.com/photo-${id}`
export const THEMES = {
  Electronics: { key: 'electronics', label: 'Tech', announce: 'Free delivery. One-year warranty on every gadget.',
    hero: { title: 'Tech that earns its desk space.', sub: 'Headphones, phones, watches and speakers, picked for how they work day to day.', image: u('1531297484001-80022131f5a1') } },
  Fashion: { key: 'fashion', label: 'Style', announce: 'Free delivery. Returns accepted within 7 days.',
    hero: { title: 'Clothes you will reach for first.', sub: 'Easy basics, good denim and shoes that survive the commute.', image: u('1581655353564-df123a1eb820') } },
  'Home & Kitchen': { key: 'home', label: 'Home', announce: 'Free delivery on every home order.',
    hero: { title: 'Small upgrades for every room.', sub: 'Cookware that lasts, bedding that is actually soft, a lamp for the corner.', image: u('1635594202056-9ea3b497e5c0') } },
  Beauty: { key: 'beauty', label: 'Beauty', announce: 'Free delivery. A sample in every order.',
    hero: { title: 'A short routine that works.', sub: 'Serum, sunscreen and a hair dryer that does not take forever.', image: u('1679394270597-e90694d70350') } },
  'Sports & Fitness': { key: 'sports', label: 'Sport', announce: 'Free delivery. 30-day returns on all gear.',
    hero: { title: 'Gear for the next session.', sub: 'Mats, dumbbells and bottles that keep up with you.', image: u('1784894645353-81486c66a687') } },
  Books: { key: 'books', label: 'Books', announce: 'Free delivery on every book.',
    hero: { title: 'Pick a good one for tonight.', sub: 'Practical reads and cookbooks to leave on the kitchen shelf.', image: u('1570676765227-b25aa08d9752') } },
  'Toys & Games': { key: 'toys', label: 'Play', announce: 'Free delivery. Gift wrapping on request.',
    hero: { title: 'Things to build, solve and laugh at.', sub: 'Blocks and board games for kids, and for the grown-ups who join in.', image: u('1730382625230-3756013c515c') } },
  Grocery: { key: 'grocery', label: 'Pantry', announce: 'Free delivery in 48 hours.',
    hero: { title: 'Pantry staples, no fuss.', sub: 'Good tea, nuts and the things you keep running out of.', image: u('1606377695906-236fdfcef767') } },
}
export const DEFAULT_THEME = { key: 'default', label: '', announce: 'Free delivery on every order. Easy returns for 7 days.',
  hero: { title: 'Good things for everyday life.', sub: 'Electronics, clothing, home and kitchen, books and more, all in one place.', image: u('1613040809024-b4ef7ba99bc3') } }

export const themeFor = (category) => THEMES[category] || DEFAULT_THEME

// Which category should the store look like right now?
//   string = that category ('' for the default look)   null = this page does not decide, keep the current look
export function inferCategory({ page, product, filters, results }) {
  if (page === 'product') return product ? product.category : null
  if (page === 'widgets') return ''
  if (page !== 'home') return null
  if (filters.category) return filters.category
  if (filters.query && results.length) {
    const counts = {}
    results.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1 })
    const [cat, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (n / results.length >= 0.6) return cat
  }
  return ''
}
