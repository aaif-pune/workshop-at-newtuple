// Store-specific bits built from the generic widgets.
import { Badge } from './widgets'

export const money = (n) => '₹' + Number(n).toLocaleString('en-IN')
export const STATUS_LABEL = { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' }
const TONE = { in_stock: 'good', low_stock: 'warn', out_of_stock: 'bad' }

export const StockBadge = ({ v }) => <Badge tone={TONE[v.status]}>{STATUS_LABEL[v.status]}{v.quantity > 0 ? ` · ${v.quantity}` : ''}</Badge>
export const Empty = ({ children }) => <p className="w-empty">{children}</p>
