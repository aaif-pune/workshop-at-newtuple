import { useState } from 'react'
import { Bell, CalendarDays } from 'lucide-react'
import { Badge, Card, CardGrid, Carousel, DataTable, FilterPanel, Hero, ListRow, NotificationList, SectionHeader, Stat, StatRow, Stepper, TileRow } from '../widgets'

// None of the data below comes from the store. These are the same widgets the shop uses.
const u = (id) => `https://images.unsplash.com/photo-${id}`
const RECIPES = [
  { id: 1, name: 'Masala chai', time: 10, level: 'Easy', diet: 'Veg', img: u('1627435601361-ec25f5b1d0e5') },
  { id: 2, name: 'Almond energy bowl', time: 5, level: 'Easy', diet: 'Vegan', img: u('1608797178974-15b35a64ede9') },
  { id: 3, name: 'One-pan veg stir fry', time: 25, level: 'Medium', diet: 'Vegan', img: u('1584990347193-6bebebfeaeee') },
  { id: 4, name: 'Weekend dal tadka', time: 40, level: 'Medium', diet: 'Veg', img: u('1542010589005-d1eacc3918f2') },
]
const TASKS = [
  { id: 1, task: 'Write release notes', owner: 'Rahul', status: 'Done' },
  { id: 2, task: 'Dry run on a clean laptop', owner: 'Himanshika', status: 'In progress' },
  { id: 3, task: 'Record backup demo video', owner: 'Both', status: 'To do' },
]
const TONE = { Done: 'good', 'In progress': 'warn', 'To do': 'neutral' }

function Block({ title, note, code, children }) {
  return (
    <section className="gal-block">
      <SectionHeader title={title} sub={note} />
      <div className="gal-demo">{children}</div>
      <pre><code>{code}</code></pre>
    </section>
  )
}

export default function Widgets() {
  const [f, setF] = useState({ diet: '', min: '', max: '' })
  const [qty, setQty] = useState(2)
  const shown = RECIPES.filter((r) => (!f.diet || r.diet === f.diet) && (f.min === '' || r.time >= +f.min) && (f.max === '' || r.time <= +f.max))
  return (
    <section className="page wide">
      <h1>Component library</h1>
      <p className="lead">Every piece of this store is a widget that only takes props. Below they show recipes, tasks and events instead of products. Same components, different data. Source is in <code>src/widgets/</code>.</p>

      <Block title="Card + CardGrid" note="Product cards in the store, recipe cards here."
        code={`<CardGrid min={220}>\n  {items.map((r) => (\n    <Card key={r.id} image={r.img} title={r.name} eyebrow={r.diet}\n      price={r.time + ' min'} badges={<Badge>{r.level}</Badge>} />\n  ))}\n</CardGrid>`}>
        <CardGrid min={200}>
          {RECIPES.map((r) => <Card key={r.id} image={r.img} ratio="4/3" title={r.name} eyebrow={r.diet} price={r.time + ' min'} badges={<Badge tone={r.level === 'Easy' ? 'good' : 'warn'}>{r.level}</Badge>} />)}
        </CardGrid>
      </Block>

      <Block title="FilterPanel" note="Filters are described as data, so the same panel works for any list."
        code={`const fields = [\n  { type: 'radio', key: 'diet', label: 'Diet', options: [...] },\n  { type: 'range', label: 'Minutes', keys: ['min', 'max'] },\n]\n<FilterPanel fields={fields} values={f} onChange={setF} onClear={...} />`}>
        <div className="gal-split">
          <FilterPanel title="Recipe filters" values={f} onChange={setF} onClear={() => setF({ diet: '', min: '', max: '' })}
            fields={[
              { type: 'radio', key: 'diet', label: 'Diet', options: [{ value: '', label: 'Any' }, { value: 'Veg', label: 'Vegetarian' }, { value: 'Vegan', label: 'Vegan' }] },
              { type: 'range', label: 'Minutes', keys: ['min', 'max'], placeholders: ['Min', 'Max'] },
            ]} />
          <div>
            <p className="sub">{shown.length} recipes</p>
            <div className="list">{shown.map((r) => <ListRow key={r.id} image={r.img} title={r.name} meta={`${r.time} min · ${r.level}`} badges={<Badge>{r.diet}</Badge>} />)}</div>
          </div>
        </div>
      </Block>

      <Block title="DataTable + Stat" note="The inventory screen is this. Here it lists team tasks."
        code={`<DataTable rows={tasks} columns={[\n  { key: 'task', header: 'Task' },\n  { key: 'status', header: 'Status', render: (t) => <Badge tone="good">{t.status}</Badge> },\n]} />`}>
        <StatRow>
          <Stat label="Tasks" value={TASKS.length} />
          <Stat label="Done" value={TASKS.filter((t) => t.status === 'Done').length} />
          <Stat label="Open" value={TASKS.filter((t) => t.status !== 'Done').length} hint="Still to ship" />
        </StatRow>
        <DataTable rows={TASKS} columns={[
          { key: 'task', header: 'Task' }, { key: 'owner', header: 'Owner' },
          { key: 'status', header: 'Status', render: (t) => <Badge tone={TONE[t.status]}>{t.status}</Badge> },
        ]} />
      </Block>

      <Block title="Hero" note="Text on one side, photo on the other."
        code={`<Hero title="Cook something new" text="..." image={url} action={{ label: 'Browse recipes', href: '#/' }} />`}>
        <Hero title="Cook something new this weekend." text="Fifteen recipes that need one pan and about half an hour." image={u('1584990347163-2b86b71390d6')} action={{ label: 'Browse recipes', href: '#/widgets' }} />
      </Block>

      <Block title="Carousel + TileRow" note="Category tiles on the home page. Here, cuisines."
        code={`<Carousel title="Cuisines">\n  <TileRow items={[{ label: 'North Indian', image: url, onClick }]} />\n</Carousel>`}>
        <Carousel title="Cuisines">
          <TileRow items={[
            { label: 'Tea and chai', image: u('1627435601361-ec25f5b1d0e5'), note: '12 recipes' },
            { label: 'Snacks', image: u('1608797178974-15b35a64ede9'), note: '9 recipes' },
            { label: 'Mains', image: u('1584990347193-6bebebfeaeee'), note: '21 recipes' },
            { label: 'Baking', image: u('1542010589005-d1eacc3918f2'), note: '7 recipes' },
          ]} />
        </Carousel>
      </Block>

      <Block title="ListRow + Stepper" note="Cart and wishlist lines. Here, an event RSVP."
        code={`<ListRow image={url} title="Pune AI meetup" meta="Sat, 10 am"\n  right={<Stepper value={qty} max={6} onChange={setQty} />} />`}>
        <div className="list">
          <ListRow image={u('1541807084-5c52b6b3adef')} title="Pune AI meetup" meta={<><CalendarDays size={14} /> Saturday, 10:00 am</>} badges={<Badge tone="good">12 seats left</Badge>}
            right={<><span className="sub">Seats</span><Stepper value={qty} max={6} onChange={setQty} label="Seats" /></>} actions={<button className="w-btn primary">RSVP</button>} />
        </div>
      </Block>

      <Block title="NotificationList" note="The bell menu. Here, release updates."
        code={`<NotificationList items={[{ id, title, message, time, read, icon }]} onOpen={...} />`}>
        <div className="gal-notifs"><NotificationList items={[
          { id: 1, title: 'Build passed', message: 'main is green, ready for the dry run.', time: '2 min ago', icon: <Bell size={18} /> },
          { id: 2, title: 'Backup video uploaded', message: 'Recorded on Friday evening.', time: '1 h ago', read: true, icon: <Bell size={18} /> },
        ]} /></div>
      </Block>
    </section>
  )
}
