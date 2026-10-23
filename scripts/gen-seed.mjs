// One-off generator for src/data/products.json. Run: node scripts/gen-seed.mjs
import { writeFileSync } from 'node:fs'
// [name, category, description, specs, [[label, price INR, qty], ...]]
const P = [
 ['Wireless Noise-Cancelling Headphones','Electronics','Over-ear Bluetooth headphones with 30-hour battery and active noise cancellation.',{battery:'30 hours',connectivity:'Bluetooth 5.3',warranty:'1 year'},[['Black',7999,0],['Silver',7999,0],['Blue',8499,3]]],
 ['Smartphone 128GB','Electronics','6.5-inch AMOLED display, 50MP camera and all-day battery.',{display:'6.5" AMOLED',storage:'128 GB',warranty:'1 year'},[['Midnight',18999,12],['Ocean Blue',18999,5],['Sunset Gold',19499,1]]],
 ['Smartwatch Fitness Tracker','Electronics','Heart-rate, sleep and step tracking with a 7-day battery.',{battery:'7 days',water_resistance:'5 ATM'},[['Black strap',3499,25],['Green strap',3499,9]]],
 ['Portable Bluetooth Speaker','Electronics','Waterproof pocket speaker with 12 hours of playtime.',{battery:'12 hours',water_resistance:'IPX7'},[['Black',2299,30],['Red',2299,0]]],
 ['Laptop 15.6-inch','Electronics','Everyday laptop for work and study, with a fast SSD.',{ram:'16 GB',storage:'512 GB SSD',warranty:'1 year'},[['Silver',52999,6],['Space Grey',54999,2]]],
 ['Power Bank 20000mAh','Electronics','Fast-charging power bank with two USB ports and USB-C.',{capacity:'20000 mAh',output:'22.5 W'},[['Black',1799,60],['White',1799,34]]],
 ['Classic Cotton T-Shirt','Fashion','Soft everyday crew-neck tee in 100% combed cotton.',{fabric:'100% cotton',fit:'Regular'},[['S',599,40],['M',599,55],['L',599,18],['XL',599,0]]],
 ['Slim Fit Denim Jeans','Fashion','Stretch denim jeans with a comfortable mid-rise fit.',{fabric:'Cotton stretch denim',fit:'Slim'},[['30',1799,14],['32',1799,20],['34',1799,4],['36',1799,0]]],
 ['Running Shoes','Fashion','Lightweight cushioned trainers for daily runs.',{upper:'Breathable mesh',sole:'EVA foam'},[['UK 7',2999,10],['UK 8',2999,15],['UK 9',2999,6],['UK 10',2999,0]]],
 ['Leather Wallet','Fashion','Slim genuine-leather wallet with card slots and coin pocket.',{material:'Genuine leather'},[['Brown',899,35],['Black',899,22]]],
 ['Backpack 25L','Fashion','Water-resistant backpack with padded laptop compartment.',{capacity:'25 litres'},[['Navy',1499,28],['Grey',1499,0]]],
 ['Non-Stick Cookware Set','Home & Kitchen','3-piece set: frying pan, kadhai and saucepan with lids.',{material:'Aluminium, non-stick',induction:'Compatible'},[['3-piece',2499,16]]],
 ['Electric Kettle 1.5L','Home & Kitchen','Stainless steel kettle with auto shut-off.',{capacity:'1.5 L',power:'1500 W'},[['Silver',1099,42],['Black',1099,8]]],
 ['Cotton Bedsheet Set','Home & Kitchen','Double bedsheet with two pillow covers, 144 thread count.',{fabric:'100% cotton'},[['Blue stripes',1299,20],['Floral',1399,0]]],
 ['LED Desk Lamp','Home & Kitchen','Dimmable desk lamp with three colour modes and USB charging.',{power:'10 W'},[['White',999,3],['Black',999,26]]],
 ['Vitamin C Face Serum','Beauty','Brightening daily serum with 10% Vitamin C.',{size:'30 ml'},[['30 ml',599,44],['50 ml',849,17]]],
 ['Sunscreen SPF 50','Beauty','Lightweight, non-greasy broad-spectrum sunscreen.',{spf:'50 PA+++'},[['50 g',449,70],['100 g',749,0]]],
 ['Hair Dryer 2000W','Beauty','Fast-drying hair dryer with cool-shot and two speeds.',{power:'2000 W'},[['Black',1299,12]]],
 ['Yoga Mat 6mm','Sports & Fitness','Non-slip, extra-cushioned exercise mat with carry strap.',{thickness:'6 mm'},[['Purple',699,38],['Teal',699,21],['Black',699,0]]],
 ['Adjustable Dumbbell Set','Sports & Fitness','Pair of adjustable dumbbells, 2 to 10 kg each.',{weight:'2-10 kg each'},[['10 kg pair',3499,7],['20 kg pair',5999,2]]],
 ['Insulated Steel Water Bottle','Sports & Fitness','Keeps drinks cold for 24 hours and hot for 12.',{material:'Stainless steel'},[['500 ml',799,50],['1 L',1099,19]]],
 ['Productivity Habits (Paperback)','Books','Practical guide to building routines that stick.',{format:'Paperback',pages:'288'},[['Paperback',399,45],['Hardcover',699,6]]],
 ['Beginner Cookbook','Books','100 easy recipes with photos for first-time cooks.',{format:'Paperback',pages:'240'},[['Paperback',499,0]]],
 ['Building Blocks Set 500 pcs','Toys & Games','Colourful creative building set for ages 6 and up.',{pieces:'500',age:'6+'},[['500 pcs',1299,18]]],
 ['Strategy Board Game','Toys & Games','Family board game for 2 to 6 players, 45 minutes.',{players:'2-6',age:'8+'},[['Standard',1499,9]]],
 ['Organic Green Tea','Grocery','Pack of 100 tea bags, naturally caffeinated.',{pack:'100 bags'},[['100 bags',349,80],['200 bags',649,0]]],
 ['Roasted Almonds','Grocery','Lightly salted roasted almonds, resealable pouch.',{type:'Roasted, salted'},[['250 g',299,60],['500 g',549,4]]],
  // AEO demo pair: the same watch listed twice. Same photo, prices and stock; only the data quality differs.
  ['Pulse 2 Smartwatch with AMOLED Display','Electronics','1.43-inch AMOLED smartwatch with heart-rate, SpO2 and sleep tracking, built-in GPS and a 10-day battery. Water resistant to 5 ATM.',{display:'1.43" AMOLED',battery:'Up to 10 days',sensors:'Heart rate, SpO2, accelerometer',gps:'Built-in',water_resistance:'5 ATM',connectivity:'Bluetooth 5.3',compatibility:'Android 8+ and iOS 14+',warranty:'1 year'},[['Black strap',4999,20],['Blue strap',4999,6]]],
  ['Smart Watch Pro Max Ultra','Electronics','Best smart watch ever! Amazing display, super long battery, tracks everything. Perfect gift. 100% waterproof.',{battery:'Long lasting',display:'HD',features:'All features'},[['Black strap',4999,20],['Blue strap',4999,6]]],
]
// Unsplash photo ids, one per product above (same order). Free to use under the Unsplash License.
const PHOTOS = ["1618366712010-f4ae9c647dcb", "1757710436034-f1d7372ec1be", "1624096104992-9b4fa3a279dd", "1582978571763-2d039e56f0c3", "1541807084-5c52b6b3adef", "1706275399494-fb26bbc5da63", "1651761179569-4ba2aa054997", "1714143136372-ddaf8b606da7", "1600185365926-3a2ce3cdb9eb", "1624538000860-24716b9050f2", "1553062407-98eeb64c6a62", "1584990347193-6bebebfeaeee", "1685514128186-c5d8d7e90e1a", "1598535746036-87d13382f6a6", "1570974802254-4b0ad1a755f5", "1764694187667-f28a05a52c0e", "1623676714504-edd78728155e", "1727364438136-6edc10ef0a52", "1763004871583-4183d64096b1", "1638536532686-d610adfc8e5c", "1544003484-3cd181d17917", "1519764340700-3db40311f21e", "1542010589005-d1eacc3918f2", "1638802538115-041e14d28d6a", "1629760946220-5693ee4c46ac", "1627435601361-ec25f5b1d0e5", "1608797178974-15b35a64ede9", "1624096104992-9b4fa3a279dd", "1624096104992-9b4fa3a279dd"]
let vid = 1
const out = P.map(([name, category, description, specs, vars], i) => ({
  id: i + 1, name, category, description, specs, image: `https://images.unsplash.com/photo-${PHOTOS[i]}`,
  variants: vars.map(([label, price, quantity], j) => ({
    id: vid++, sku: `SW-${String(i + 1).padStart(3, '0')}-${j + 1}`, label, price, quantity,
  })),
}))
writeFileSync(new URL('../src/data/products.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.log(out.length, 'products', vid - 1, 'variants')
