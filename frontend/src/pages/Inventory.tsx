import { useState, useEffect } from 'react'
import { inventoryApi, type InventoryRecord } from '../api/inventory'
import { itemsApi, type Item } from '../api/items'
import { colors } from '../theme'

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 10px', marginBottom: 12,
  background: colors.bgSecondary, border: `1px solid ${colors.border}`,
  color: colors.textPrimary, borderRadius: 4, fontSize: 14, boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}
const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: colors.redPrimary, color: 'white',
  border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 13,
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: colors.textMuted,
  border: `1px solid ${colors.border}`, cursor: 'pointer', borderRadius: 4, fontSize: 13,
}

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ item_id: '', quantity: '', location: '' })
  const [editing, setEditing] = useState<InventoryRecord | null>(null)
  const [restocking, setRestocking] = useState<InventoryRecord | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = () => Promise.all([inventoryApi.list(), itemsApi.list()]).then(([inv, its]) => {
    setInventory(inv); setItems(its)
  })
  useEffect(() => { load() }, [])

  const getItemName = (item_id: string) => items.find(i => i.id === item_id)?.name || item_id.slice(0, 8)

  const openCreate = () => {
    setEditing(null)
    setForm({ item_id: items[0]?.id || '', quantity: '', location: '' })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (rec: InventoryRecord) => {
    setEditing(rec)
    setForm({ item_id: rec.item_id, quantity: String(rec.quantity), location: rec.location })
    setError(null)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      if (editing) {
        await inventoryApi.update(editing.id, { quantity: Number(form.quantity), location: form.location || undefined })
      } else {
        // BUG 2: location is passed as-is — if empty, backend returns 422
        await inventoryApi.create({
          item_id: form.item_id,
          quantity: Number(form.quantity),
          location: form.location || undefined,
        })
      }
      setShowForm(false)
      load()
    } catch (e: any) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'An error occurred')
    }
  }

  const handleRestock = async () => {
    if (!restocking) return
    try {
      await inventoryApi.update(restocking.id, { quantity: restocking.quantity + Number(restockQty) })
      setRestocking(null)
      setRestockQty('')
      load()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Error restocking')
    }
  }

  return (
    <div style={{ color: colors.textPrimary }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🗃️ Inventory</h2>
        <button style={btnPrimary} onClick={openCreate}>+ New Inventory</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Item', 'Quantity', 'Location', 'Updated', ''].map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventory.map(rec => (
            <tr key={rec.id}
              style={{ borderBottom: `1px solid ${colors.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = colors.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => openEdit(rec)}>
                {getItemName(rec.item_id)}
              </td>
              <td style={{ padding: '10px 12px', color: rec.quantity < 10 ? colors.redBright : colors.textPrimary, fontWeight: rec.quantity < 10 ? 700 : 400 }}>
                {rec.quantity}
              </td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontFamily: 'monospace' }}>{rec.location}</td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 12 }}>
                {new Date(rec.updated_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  onClick={() => { setRestocking(rec); setRestockQty('') }}
                  style={{ padding: '4px 10px', fontSize: 11, background: colors.bgSecondary,
                           color: colors.redAccent, border: `1px solid ${colors.border}`,
                           cursor: 'pointer', borderRadius: 4 }}>
                  + Restock
                </button>
              </td>
            </tr>
          ))}
          {inventory.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: colors.textMuted }}>No inventory records</td></tr>
          )}
        </tbody>
      </table>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: colors.bgCard, padding: 28, borderRadius: 8,
                        minWidth: 380, border: `1px solid ${colors.border}` }}>
            <h3 style={{ margin: '0 0 20px' }}>{editing ? 'Edit Inventory' : 'New Inventory'}</h3>
            {error && (
              <div style={{ color: colors.redBright, background: `${colors.redDeep}22`,
                            border: `1px solid ${colors.redDeep}`, borderRadius: 4,
                            padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                {error}
              </div>
            )}
            {!editing && (
              <select value={form.item_id} onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))} style={selectStyle}>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            )}
            <input
              type="number" placeholder="Quantity" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              style={inputStyle}
            />
            {/* BUG 2: Location looks optional — no asterisk, no required attr */}
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
              <button style={btnPrimary} onClick={handleSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restocking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: colors.bgCard, padding: 28, borderRadius: 8,
                        minWidth: 320, border: `1px solid ${colors.border}` }}>
            <h3 style={{ margin: '0 0 16px' }}>Restock — {getItemName(restocking.item_id)}</h3>
            <p style={{ color: colors.textMuted, margin: '0 0 12px', fontSize: 13 }}>
              Current stock: {restocking.quantity} @ {restocking.location}
            </p>
            <input type="number" placeholder="Add quantity" value={restockQty}
              onChange={e => setRestockQty(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setRestocking(null)}>Cancel</button>
              <button style={btnPrimary} onClick={handleRestock}>Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
