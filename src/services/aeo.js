// Session 4: answer-engine optimisation (AEO). Pure functions, no storage.
// The audit only reads product data. It never invents facts: the suggested fix is drafted from what
// the listing already says, and anything missing is returned as a question for the seller to answer.

// Must-have facts per kind of product (at most RULES.min_key_specs of them are required).
const KEY_SPECS = {
  'water bottle': ['weight', 'capacity', 'material', 'insulation', 'leak_proof', 'warranty'],
  headphones: ['weight', 'battery', 'connectivity', 'noise_cancellation', 'charging', 'warranty'],
}
const GENERAL_SPECS = ['weight', 'material', 'warranty']
// Facts worth asking about for any listing, besides the ones rival listings publish.
const COMMON_FACTS = ['dimensions', 'colour', 'care', 'country_of_origin']
// "Product information" groups, like a marketplace listing. Display only: specs stay one flat
// name: value object, so any name works; names not listed here go to "Other details".
const SPEC_GROUPS = [
  ['Measurements', ['capacity', 'weight', 'size', 'dimensions', 'thickness', 'pages', 'pieces', 'pack']],
  ['Style', ['colour', 'color', 'finish', 'shape', 'style', 'fit', 'type']],
  ['Materials & Care', ['material', 'fabric', 'upper', 'sole', 'care', 'care_instructions', 'dishwasher_safe']],
  ['Features & Specs', ['insulation', 'leak_proof', 'lid', 'lid_type', 'battery', 'connectivity', 'noise_cancellation',
    'charging', 'water_resistance', 'display', 'storage', 'ram', 'power', 'output', 'induction', 'spf', 'players', 'age', 'format']],
  ['Item details', ['warranty', 'fits', 'country_of_origin']],
]
const OTHER = 'Other details'
const GROUP_TITLES = [...SPEC_GROUPS.map(([title]) => title), OTHER]
const SPEC_ORDER = SPEC_GROUPS.flatMap(([, names]) => names)

// Pass thresholds, published with every audit so an agent can meet them first time. Search results show
// about seo_title_max_chars / meta_description_max_chars; longer text is a warning, not an error.
const RULES = {
  min_summary_chars: 40, min_faqs: 3, min_key_specs: 5, min_best_for: 2, min_description_chars: 80,
  min_about_points: 3, max_about_points: 6, seo_title_max_chars: 60, meta_description_max_chars: 160,
  comparable: 'Publish every key spec that competing listings of the same kind publish.',
}
// Input limits for one update: characters per text, items per list.
const LIMITS = {
  summary: 400, description: 600, seo_title: 120, meta_description: 320, spec: 80, spec_name: 30,
  keywords: 15, keyword: 40, best_for: 8, use_case: 40, about: 6, about_point: 200, faqs: 8, question: 160, answer: 400,
}
const QUESTIONS = {
  weight: 'What does it weigh?', capacity: 'What sizes or capacity does it come in?', material: 'What is it made of?',
  insulation: 'How long does it keep drinks cold or hot?', leak_proof: 'Is it leak-proof?', warranty: 'What is the warranty?',
  dimensions: 'What are its dimensions?', colour: 'What colours does it come in?', care: 'How should it be cleaned or cared for?',
  country_of_origin: 'Where is it made?', lid_type: 'What kind of lid does it have?', battery: 'How long does the battery last?',
  connectivity: 'How does it connect (e.g. Bluetooth version)?', noise_cancellation: 'Does it have noise cancellation, and what kind?',
  charging: 'How does it charge, and how long does it take?',
}

export const label = (name) => name.replace(/_/g, ' ')
const filled = (v) => v != null && String(v).trim() !== ''
const ask = (name) => QUESTIONS[name] || `What is the ${label(name)}?`
const groupOf = (name) => SPEC_GROUPS.find(([, names]) => names.includes(name))?.[0] || OTHER
const bySpecOrder = (a, b) => SPEC_ORDER.indexOf(a) - SPEC_ORDER.indexOf(b)
const keySpecsFor = (product) => KEY_SPECS[product.kind] || GENERAL_SPECS
const fit = (text, max) => {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max - 1)
  return text.slice(0, cut > 0 ? cut : max - 1).replace(/[,;:.\s]+$/, '') + '…'
}

export const aeoOf = (product) => ({
  summary: '', faqs: [], keywords: [], best_for: [], about: [], seo_title: '', meta_description: '', ...(product.aeo || {}),
})

// AEO text search can match on. Specs stay out so pre-Session-4 searches behave as before.
export function aeoText(product) {
  const a = aeoOf(product)
  return [a.summary, ...a.keywords, ...a.best_for, ...a.faqs.flatMap((f) => [f.q, f.a]), ...a.about].join(' ')
}

// Relevance for a search: words an engine treats as intent signals (best for, keywords) score higher than
// words only in the marketing description, plus a small bonus for each readiness check the listing passes.
export function relevanceScore(product, tokens) {
  const a = aeoOf(product)
  const fields = [
    [product.name, 5], [a.best_for.join(' '), 6], [a.keywords.join(' '), 4], [a.summary, 3],
    [a.faqs.map((f) => `${f.q} ${f.a}`).join(' '), 2], [Object.values(product.specs || {}).join(' '), 2],
    [`${product.category} ${product.description} ${a.about.join(' ')}`, 1],
  ].map(([text, weight]) => [String(text).toLowerCase(), weight])
  let score = 0
  for (const t of tokens) for (const [text, weight] of fields) if (text.includes(t)) score += weight
  return score + auditProduct(product).checks.filter((c) => c.pass && c.id !== 'comparable').length * 0.5
}

// Six checks, each pass or fail. `peers` are competing listings of the same kind; `question` is the buyer
// question the audit was run for, returned for context.
export function auditProduct(product, peers = [], question = '') {
  const a = aeoOf(product)
  const specs = product.specs || {}
  const has = (name) => filled(specs[name])
  const keyList = keySpecsFor(product), minKey = Math.min(RULES.min_key_specs, keyList.length)
  const keyPresent = keyList.filter(has), keyMissing = keyList.filter((n) => !has(n))
  const peerFacts = [...new Set(peers.flatMap((p) => Object.keys(p.specs || {}).filter((n) => filled(p.specs[n]))))]
  const missingVsPeers = peerFacts.filter((n) => keyList.includes(n) && !has(n))
  const description = String(product.description || '').trim()

  const checks = [
    { id: 'summary', label: 'Short answer ("In short")', pass: a.summary.trim().length >= RULES.min_summary_chars,
      fix: 'Add one or two sentences that say what it is, who it is for and what makes it different, with numbers.' },
    { id: 'faqs', label: `FAQs buyers ask (${RULES.min_faqs}+)`, pass: a.faqs.length >= RULES.min_faqs,
      fix: `Answer at least ${RULES.min_faqs} real buyer questions. You have ${a.faqs.length}.` },
    { id: 'key_specs', label: 'Key facts filled in', pass: keyPresent.length >= minKey,
      fix: `Add the missing facts: ${keyMissing.map(label).join(', ')}.` },
    { id: 'best_for', label: 'Best for (use cases)', pass: a.best_for.length >= RULES.min_best_for,
      fix: 'Say who or what it is best for, for example trekking, office or gym.' },
    { id: 'comparable', label: 'Comparable with other sellers',
      pass: peers.length ? !missingVsPeers.length : keyPresent.length >= minKey,
      fix: missingVsPeers.length
        ? `Other sellers publish ${missingVsPeers.map(label).join(', ')}. An AI cannot compare you on facts you leave out.`
        : 'Publish the same key facts other sellers do, in the same fields.' },
    { id: 'description', label: 'Clear, specific description', pass: description.length >= RULES.min_description_chars,
      fix: `Write at least ${RULES.min_description_chars} characters with concrete details. Yours has ${description.length}.` },
  ]

  // Product information gaps per group (not scored): facts rivals publish, plus a few common ones.
  const present = Object.keys(specs).filter(has)
  const wanted = [...new Set([...peerFacts, ...COMMON_FACTS])].filter((n) => !has(n) && !(n === 'color' && has('colour')))
  const productInfo = GROUP_TITLES.map((group) => ({
    group, filled: present.filter((n) => groupOf(n) === group), missing: wanted.filter((n) => groupOf(n) === group),
  })).filter((g) => g.filled.length || g.missing.length)

  // Draft fix from existing data only. Missing facts become questions, not guesses.
  const sizes = (product.variants || []).map((v) => `${v.label} at ₹${v.price}`)
  const draftSummary = a.summary || [`${product.name}${product.seller ? ` from ${product.seller}` : ''}.`, product.description,
    sizes.length ? `Available in ${sizes.join(', ')}.` : ''].filter(Boolean).join(' ')
  const draftFaqs = a.faqs.length ? a.faqs : present.slice(0, RULES.min_faqs).map((n) => ({ q: ask(n), a: String(specs[n]) }))
  const questions = [...new Set([
    ...keyMissing.map(ask),
    ...(a.best_for.length < RULES.min_best_for ? ['What is it best for? (for example trekking, office, gym)'] : []),
    ...(a.faqs.length < RULES.min_faqs ? ['What do buyers most often ask before buying?'] : []),
    ...productInfo.flatMap((g) => g.missing).map(ask),
    ...(a.about.length < RULES.min_about_points
      ? [`What are the ${RULES.min_about_points} to ${RULES.max_about_points} most important things a buyer should know about it? (for "About this item")`] : []),
  ])]

  return {
    product_id: product.id, product_name: product.name, seller: product.seller || null, question: question || null,
    score: checks.filter((c) => c.pass).length, max: checks.length,
    checks: checks.map(({ id, label, pass, fix }) => ({ id, label, pass, ...(pass ? {} : { fix }) })),
    compared_with: peers.map((p) => ({ id: p.id, name: p.name, seller: p.seller || null })),
    shared_fields_with_peers: peerFacts.filter(has),
    product_information: productInfo,
    about_this_item: { points: a.about.length, ok: a.about.length >= RULES.min_about_points && a.about.length <= RULES.max_about_points },
    rules: { ...RULES, kind: product.kind || null, key_specs: keyList, min_key_specs: minKey },
    suggested_fix: {
      summary: draftSummary, faqs: draftFaqs, keywords: a.keywords, best_for: a.best_for,
      seo_title: a.seo_title || fit(`${product.name}${product.seller ? ` | ${product.seller}` : ''}`, RULES.seo_title_max_chars),
      meta_description: a.meta_description || fit(String(a.summary || product.description || ''), RULES.meta_description_max_chars),
      known_facts: present.map((n) => `${label(n)}: ${specs[n]}`),
      questions_for_seller: questions,
      note: 'Drafted only from facts already on this listing. Answer the questions above, review the wording, preview it with preview_aeo_update, then apply with set_aeo_metadata after approval.',
    },
  }
}

// Validate and merge an AEO update. Only fields the caller supplies change.
function mergeAeo(product, input = {}) {
  const str = (v, name, max) => {
    if (v != null && typeof v === 'object') throw new Error(`${name} must be text`)
    const s = String(v ?? '').trim()
    if (s.length > max) throw new Error(`${name} must be ${max} characters or fewer`)
    return s
  }
  const list = (v, name, maxItems, maxLen) => {
    if (!Array.isArray(v)) throw new Error(`${name} must be a list`)
    if (v.length > maxItems) throw new Error(`${name} can have at most ${maxItems} items`)
    return v.map((x, i) => str(x, `${name}[${i}]`, maxLen)).filter(Boolean)
  }
  const current = aeoOf(product)
  const next = { ...current }
  if (input.summary != null) next.summary = str(input.summary, 'summary', LIMITS.summary)
  if (input.keywords != null) next.keywords = list(input.keywords, 'keywords', LIMITS.keywords, LIMITS.keyword)
  if (input.best_for != null) next.best_for = list(input.best_for, 'best_for', LIMITS.best_for, LIMITS.use_case)
  if (input.about != null) next.about = list(input.about, 'about', LIMITS.about, LIMITS.about_point)
  if (input.seo_title != null) next.seo_title = str(input.seo_title, 'seo_title', LIMITS.seo_title)
  if (input.meta_description != null) next.meta_description = str(input.meta_description, 'meta_description', LIMITS.meta_description)
  if (input.faqs != null) {
    const mode = input.faqs_mode ?? 'add'
    if (!['add', 'replace'].includes(mode)) throw new Error('faqs_mode must be "add" or "replace"')
    if (!Array.isArray(input.faqs) || input.faqs.length > LIMITS.faqs) throw new Error(`faqs must be a list of at most ${LIMITS.faqs} {q, a} items`)
    const given = input.faqs.map((f, i) => {
      const q = str(f?.q, `faqs[${i}].q`, LIMITS.question), a = str(f?.a, `faqs[${i}].a`, LIMITS.answer)
      if (!q || !a) throw new Error(`faqs[${i}] needs both q and a`)
      return { q, a }
    })
    // add: keep existing FAQs and give a question that is already there the new answer. replace: exactly `given`.
    const same = (x, y) => x.q.toLowerCase() === y.q.toLowerCase()
    next.faqs = mode === 'replace' ? given
      : [...current.faqs.map((f) => given.find((g) => same(g, f)) || f), ...given.filter((g) => !current.faqs.some((f) => same(f, g)))]
    if (next.faqs.length > LIMITS.faqs) throw new Error(`That makes ${next.faqs.length} FAQs; at most ${LIMITS.faqs}. Use faqs_mode "replace" to rewrite the list.`)
  }
  const specs = { ...(product.specs || {}) }
  if (input.specs != null) {
    if (typeof input.specs !== 'object' || Array.isArray(input.specs)) throw new Error('specs must be an object of name: value')
    for (const [k, v] of Object.entries(input.specs)) {
      const name = String(k).trim().toLowerCase().replace(/[\s-]+/g, '_')
      if (!new RegExp(`^[a-z][a-z0-9_]{1,${LIMITS.spec_name - 1}}$`).test(name)) throw new Error(`spec name "${k}" is not valid`)
      const value = str(v, `specs.${name}`, LIMITS.spec)
      if (value) specs[name] = value
      else delete specs[name] // an empty value removes the fact
    }
  }
  const description = input.description != null ? str(input.description, 'description', LIMITS.description) : product.description
  return { aeo: next, specs, description }
}

// Short, stable fingerprint (cyrb53). Pure JS so the browser and Node agree.
function fingerprint(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
// Same listing, same id: spec order does not matter.
const canonical = (listing) => ({ ...listing, specs: Object.fromEntries(Object.entries(listing.specs).sort(([a], [b]) => a.localeCompare(b))) })

const numbersIn = (text) => [...new Set((String(text).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n) => n.replace(/,/g, '')))]
const AEO_FIELDS = ['summary', 'faqs', 'keywords', 'best_for', 'about', 'seo_title', 'meta_description', 'specs', 'description']

// Plan an update without saving: `plan` is what the user approves (changes, new facts, warnings, scores and a
// change_id that set_aeo_metadata must echo back); `next` is the merged listing to save. The id covers the
// current and the proposed listing, so it goes stale if either changes.
export function planAeoUpdate(product, peers = [], input = {}) {
  const proposed = Object.fromEntries(AEO_FIELDS.filter((k) => input[k] != null).map((k) => [k, input[k]]))
  if (!Object.keys(proposed).length) throw new Error(`Nothing to update. Supply at least one of: ${AEO_FIELDS.join(', ')}.`)
  if (proposed.faqs && input.faqs_mode != null) proposed.faqs_mode = input.faqs_mode
  const next = mergeAeo(product, proposed)
  const current = { aeo: aeoOf(product), specs: product.specs || {}, description: product.description }

  // Text written in this update (existing listing text is not re-checked).
  const written = []
  for (const k of ['summary', 'seo_title', 'meta_description']) if (proposed[k] != null) written.push([k, next.aeo[k]])
  if (proposed.description != null) written.push(['description', next.description])
  for (const k of ['keywords', 'best_for']) if (proposed[k] != null) written.push([k, next.aeo[k].join(' ')])
  if (proposed.about != null) next.aeo.about.forEach((t, i) => written.push([`about[${i}]`, t]))
  if (proposed.faqs != null) proposed.faqs.forEach((f, i) => written.push([`faqs[${i}]`, `${f.q} ${f.a}`]))

  // Only this product's own facts: never name a competing seller or listing.
  const rivals = [...new Set(peers.flatMap((p) => [p.seller, p.name]).filter((n) => n && n !== product.seller))]
  for (const [field, text] of written) {
    const hit = rivals.find((n) => text.toLowerCase().includes(n.toLowerCase()))
    if (hit) throw new Error(`${field} mentions a competing listing ("${hit}"). Describe only this product; do not make claims about competitors.`)
  }

  // Numbers in the wording should be backed by specs, variants or the existing description.
  const evidence = new Set(numbersIn([...Object.values(next.specs), product.name, product.description,
    ...(product.variants || []).flatMap((v) => [v.label, v.price])].join(' ')))
  const warnings = written.flatMap(([field, text]) => numbersIn(text).filter((n) => !evidence.has(n))
    .map((n) => `${field}: "${n}" is not in this listing's specs, variants or description. Check it with the seller, or add it as a spec.`))
  for (const [field, max] of [['seo_title', RULES.seo_title_max_chars], ['meta_description', RULES.meta_description_max_chars]]) {
    const len = next.aeo[field].length
    if (proposed[field] != null && len > max) warnings.push(`${field} is ${len} characters; search results show about ${max}, so the rest is cut off.`)
  }
  if (proposed.about != null && next.aeo.about.length < RULES.min_about_points) {
    warnings.push(`about has ${next.aeo.about.length} point(s); ${RULES.min_about_points} to ${RULES.max_about_points} short points work best.`)
  }

  const changes = []
  const diff = (field, before, after) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ field, before: before ?? null, after: after ?? null })
  }
  for (const k of ['summary', 'keywords', 'best_for', 'about', 'faqs', 'seo_title', 'meta_description']) if (proposed[k] != null) diff(k, current.aeo[k], next.aeo[k])
  for (const k of new Set([...Object.keys(current.specs), ...Object.keys(next.specs)])) diff(`specs.${k}`, current.specs[k], next.specs[k])
  if (proposed.description != null) diff('description', current.description, next.description)
  // Facts added, changed or removed. Code cannot verify them, so the approver confirms each came from the seller.
  const newFacts = changes.filter((c) => c.field.startsWith('specs.')).map((c) => {
    const name = c.field.slice('specs.'.length)
    return { group: groupOf(name), fact: label(name), value: c.after, before: c.before }
  })

  const before = auditProduct(product, peers), after = auditProduct({ ...product, ...next }, peers)
  const plan = {
    product_id: product.id, product_name: product.name, proposed, changes, warnings,
    new_facts: newFacts, ...(newFacts.length ? { confirm: 'Check every new fact came from the seller before approving.' } : {}),
    score_before: before.score, score_after: after.score, max: after.max, still_failing: after.checks.filter((c) => !c.pass),
    change_id: fingerprint(JSON.stringify([product.id, canonical(current), canonical(next)])),
  }
  return { plan, next }
}

// The listing's facts as "Product information" groups, with recommended uses, seller and SKUs in Item details.
export function productInformation(product) {
  const specs = product.specs || {}
  const a = aeoOf(product)
  const names = Object.keys(specs).filter((n) => filled(specs[n]))
  const skus = (product.variants || []).map((v) => v.sku).filter(Boolean)
  return GROUP_TITLES.map((title) => {
    const rows = names.filter((n) => groupOf(n) === title).sort(bySpecOrder).map((n) => [label(n), specs[n]])
    if (title === 'Item details') {
      if (a.best_for.length) rows.unshift(['recommended uses', a.best_for.join(', ')])
      if (product.seller) rows.push(['sold by', product.seller])
      if (skus.length) rows.push([skus.length > 1 ? 'SKUs' : 'SKU', skus.join(', ')])
    }
    return { title, rows }
  }).filter((g) => g.rows.length)
}

// schema.org Product + FAQPage JSON-LD for the product page.
export function jsonLd(product) {
  const a = aeoOf(product)
  const graph = [{
    '@type': 'Product', name: product.name, description: a.summary || product.description,
    category: product.category, image: product.image || undefined,
    brand: product.seller ? { '@type': 'Brand', name: product.seller } : undefined,
    additionalProperty: Object.entries(product.specs || {}).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    offers: (product.variants || []).map((v) => ({
      '@type': 'Offer', sku: v.sku, name: v.label, price: v.price, priceCurrency: 'INR',
      availability: `https://schema.org/${v.quantity > 0 ? 'InStock' : 'OutOfStock'}`,
    })),
  }]
  if (a.faqs.length) graph.push({
    '@type': 'FAQPage',
    mainEntity: a.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  })
  return { '@context': 'https://schema.org', '@graph': graph }
}
