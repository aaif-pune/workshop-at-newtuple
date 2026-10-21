// AEO (answer engine optimisation): turn the product's metadata into what search engines
// and AI assistants read: schema.org JSON-LD, a page title and a meta description.
const AVAILABILITY = {
  in_stock: 'https://schema.org/InStock',
  low_stock: 'https://schema.org/LimitedAvailability',
  out_of_stock: 'https://schema.org/OutOfStock',
}
const absolute = (u) => (u.startsWith('/') ? location.origin + u : u)

export function productJsonLd(p) {
  const m = p.metadata || {}
  const url = `${location.origin}${location.pathname}#/product/${p.id}`
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: m.summary || p.description,
    image: p.images.map(absolute),
    category: p.category,
    keywords: m.keywords?.length ? m.keywords.join(', ') : undefined,
    additionalProperty: Object.entries(p.specs || {}).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    offers: p.variants.map((v) => ({
      '@type': 'Offer', sku: v.sku, name: v.label, price: v.price, priceCurrency: 'INR',
      availability: AVAILABILITY[v.status], url,
    })),
  }
  if (!m.faqs?.length) return [product]
  return [product, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: m.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  }]
}

// Writes the title, meta description and JSON-LD into <head>. Returns a function that restores the page.
export function applyHead(p) {
  const m = p.metadata || {}
  const oldTitle = document.title
  document.title = m.seo_title || `${p.name} | ShopWave`

  let meta = document.querySelector('meta[name="description"]')
  const madeMeta = !meta
  const oldDesc = meta?.getAttribute('content')
  if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
  meta.setAttribute('content', m.meta_description || p.description || '')

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'ld-json'
  script.textContent = JSON.stringify(productJsonLd(p))
  document.head.appendChild(script)

  return () => {
    document.title = oldTitle
    script.remove()
    if (madeMeta) meta.remove(); else meta.setAttribute('content', oldDesc ?? '')
  }
}
