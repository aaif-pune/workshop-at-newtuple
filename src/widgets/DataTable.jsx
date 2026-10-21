/** Table for any rows. Props: columns = [{ key, header, render(row), align }], rows, rowKey (field or fn), empty (node). */
export default function DataTable({ columns, rows, rowKey = 'id', empty = 'Nothing here.' }) {
  if (!rows.length) return <p className="w-empty">{empty}</p>
  const keyOf = (r) => (typeof rowKey === 'function' ? rowKey(r) : r[rowKey])
  return (
    <div className="w-tablewrap">
      <table className="w-table">
        <thead><tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align }}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={keyOf(r)}>{columns.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
