import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi, type Order } from '../api/orders'
import { itemsApi, type Item } from '../api/items'
import { StateBadge } from '../components/StateBadge'
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

interface DraftLine {
  item_id: string
  requested_qty: number
}

export function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [showModal, setShowModal] = useState(false)
  const [orderName, setOrderName] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([{ item_id: '', requested_qty: 1 }])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = () => ordersApi.list().then(setOrders)

  useEffect(() => {
    load()
    itemsApi.list().then(setItems)
  }, [])

  const openModal = () => {
    setOrderName('')
    setLines([{ item_id: items[0]?.id || '', requested_qty: 1 }])
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setError(null)
  }

  const addLine = () => {
    setLines(prev => [...prev, { item_id: items[0]?.id || '', requested_qty: 1 }])
  }

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: keyof DraftLine, value: string | number) => {
    setLines(prev => prev.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await ordersApi.create({
        name: orderName,
        lines: lines.map(l => ({ item_id: l.item_id, requested_qty: l.requested_qty })),
      })
      setShowModal(false)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ color: colors.textPrimary }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>📋 Orders</h2>
        <button style={btnPrimary} onClick={openModal}>+ New Order</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Name', 'Status', 'Shortfall Mode', '# Lines', 'Created At'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = colors.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{order.name}</td>
              <td style={{ padding: '10px 12px' }}>
                <StateBadge status={order.status} type="order" />
              </td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontFamily: 'monospace', fontSize: 12 }}>
                {order.shortfall_mode}
              </td>
              <td style={{ padding: '10px 12px', color: colors.textMuted }}>
                {order.lines?.length ?? '—'}
              </td>
              <td style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 12 }}>
                {new Date(order.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: colors.textMuted }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: colors.bgCard, padding: 28, borderRadius: 8,
            minWidth: 480, maxWidth: 640, width: '90%',
            border: `1px solid ${colors.border}`,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px', color: colors.textPrimary }}>New Order</h3>

            {error && (
              <div style={{
                color: colors.redBright, background: `${colors.redDeep}22`,
                border: `1px solid ${colors.redDeep}`, borderRadius: 4,
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
              Order Name
            </label>
            <input
              placeholder="e.g. Order-001"
              value={orderName}
              onChange={e => setOrderName(e.target.value)}
              style={inputStyle}
            />

            <div style={{ margin: '16px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Order Lines
              </span>
              <button
                onClick={addLine}
                style={{
                  padding: '4px 10px', fontSize: 11, background: colors.bgSecondary,
                  color: colors.redAccent, border: `1px solid ${colors.border}`,
                  cursor: 'pointer', borderRadius: 4,
                }}
              >
                + Add Line
              </button>
            </div>

            {lines.map((line, index) => (
              <div key={index} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
                padding: '10px 12px', background: colors.bgSecondary,
                border: `1px solid ${colors.border}`, borderRadius: 4,
              }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
                    Item
                  </label>
                  <select
                    value={line.item_id}
                    onChange={e => updateLine(index, 'item_id', e.target.value)}
                    style={{ ...selectStyle, marginBottom: 0 }}
                  >
                    {items.length === 0 && (
                      <option value="">Loading items…</option>
                    )}
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={line.requested_qty}
                    onChange={e => updateLine(index, 'requested_qty', Number(e.target.value))}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
                {lines.length > 1 && (
                  <div style={{ paddingTop: 20 }}>
                    <button
                      onClick={() => removeLine(index)}
                      style={{
                        padding: '6px 10px', background: 'transparent',
                        color: colors.redAccent, border: `1px solid ${colors.redDeep}`,
                        cursor: 'pointer', borderRadius: 4, fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={btnSecondary} onClick={closeModal}>
                Cancel
              </button>
              <button
                style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
