import { useState, useEffect } from 'react'
import { itemsApi, type Item } from '../api/items'
import { colors } from '../theme'

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 10px', marginBottom: 12,
  background: colors.bgSecondary, border: `1px solid ${colors.border}`,
  color: colors.textPrimary, borderRadius: 4, fontSize: 14, boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: colors.redPrimary, color: 'white',
  border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 13,
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: colors.textMuted,
  border: `1px solid ${colors.border}`, cursor: 'pointer', borderRadius: 4, fontSize: 13,
}

export function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', description: '' })
  const [editing, setEditing] = useState<Item | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = () => itemsApi.list().then(setItems)
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', sku: '', description: '' })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({ name: item.name, sku: item.sku, description: item.description || '' })
    setError(null)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (editing) {
        await itemsApi.update(editing.id, form)
      } else {
        await itemsApi.create(form)
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (e: any) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ color: colors.textPrimary }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>📦 Items</h2>
        <button style={btnPrimary} onClick={openCreate}>+ New Item</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Name', 'SKU', 'Description', 'Updated'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}
              onClick={() => openEdit(item)}
              style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = colors.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.name}</td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontFamily: 'monospace' }}>{item.sku}</td>
              <td style={{ padding: '10px 12px', color: colors.textMuted }}>{item.description || '—'}</td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 12 }}>
                {new Date(item.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: colors.textMuted }}>No items found</td></tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: colors.bgCard, padding: 28, borderRadius: 8,
            minWidth: 380, border: `1px solid ${colors.border}`,
          }}>
            <h3 style={{ margin: '0 0 20px', color: colors.textPrimary }}>
              {editing ? 'Edit Item' : 'New Item'}
            </h3>
            {error && (
              <div style={{
                color: colors.redBright, background: `${colors.redDeep}22`,
                border: `1px solid ${colors.redDeep}`, borderRadius: 4,
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                {error}
              </div>
            )}
            <input
              placeholder="Item name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="SKU (e.g. WGT-001)"
              value={form.sku}
              onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={btnSecondary} onClick={() => { setShowForm(false); setEditing(null) }}>
                Cancel
              </button>
              <button style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
