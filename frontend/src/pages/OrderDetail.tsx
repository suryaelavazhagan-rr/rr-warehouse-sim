import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersApi, type Order } from '../api/orders'
import { StateBadge } from '../components/StateBadge'
import { SSEFeed } from '../components/SSEFeed'
import { useOrderSSE } from '../hooks/useOrderSSE'
import { colors } from '../theme'

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: colors.redPrimary, color: 'white',
  border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 13,
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: colors.textMuted,
  border: `1px solid ${colors.border}`, cursor: 'pointer', borderRadius: 4, fontSize: 13,
}

const CANCELLABLE_STATUSES = ['PENDING', 'PICKING']

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const events = useOrderSSE(id ?? '')

  const load = () => {
    if (!id) return
    ordersApi.get(id).then(setOrder).catch((e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Failed to load order')
    })
  }

  useEffect(() => {
    load()
  }, [id])

  const handleCancel = async () => {
    if (!id || !order) return
    setCancelling(true)
    setError(null)
    try {
      await ordersApi.cancel(id)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (error && !order) {
    return (
      <div style={{ color: colors.textPrimary }}>
        <button
          style={{ ...btnSecondary, marginBottom: 16 }}
          onClick={() => navigate('/orders')}
        >
          ← Back to Orders
        </button>
        <div style={{
          color: colors.redBright, background: `${colors.redDeep}22`,
          border: `1px solid ${colors.redDeep}`, borderRadius: 4,
          padding: '12px 16px', fontSize: 13,
        }}>
          {error}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ color: colors.textMuted, padding: 40, textAlign: 'center' }}>
        Loading order…
      </div>
    )
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status)

  return (
    <div style={{ color: colors.textPrimary }}>
      {/* Back navigation */}
      <button
        style={{ ...btnSecondary, marginBottom: 20, fontSize: 12 }}
        onClick={() => navigate('/orders')}
      >
        ← Back to Orders
      </button>

      {/* Error banner */}
      {error && (
        <div style={{
          color: colors.redBright, background: `${colors.redDeep}22`,
          border: `1px solid ${colors.redDeep}`, borderRadius: 4,
          padding: '8px 12px', marginBottom: 16, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Order Header */}
      <div style={{
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: 8, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>{order.name}</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <StateBadge status={order.status} type="order" />
              <span style={{ fontSize: 12, color: colors.textMuted }}>
                <span style={{ color: colors.textMuted, marginRight: 4 }}>Shortfall:</span>
                <span style={{ fontFamily: 'monospace', color: colors.textPrimary }}>{order.shortfall_mode}</span>
              </span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>
                Created {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            style={{
              ...btnPrimary,
              opacity: canCancel && !cancelling ? 1 : 0.4,
              cursor: canCancel && !cancelling ? 'pointer' : 'not-allowed',
              background: colors.redDeep,
            }}
            onClick={handleCancel}
            disabled={!canCancel || cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      </div>

      {/* Order Lines */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
          Order Lines
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              {['Item ID', 'Requested Qty', 'Fulfilled Qty', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(order.lines ?? []).map(line => (
              <tr
                key={line.id}
                style={{ borderBottom: `1px solid ${colors.border}` }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.bgHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: colors.textMuted }}>
                  {line.item_id}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {line.requested_qty}
                </td>
                <td style={{ padding: '10px 12px', color: line.fulfilled_qty >= line.requested_qty ? colors.success : colors.textPrimary }}>
                  {line.fulfilled_qty}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <StateBadge status={line.status} type="line" />
                </td>
              </tr>
            ))}
            {(order.lines ?? []).length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: colors.textMuted }}>
                  No order lines
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Live Events Feed */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
          Live Events
        </h3>
        <SSEFeed events={events} />
      </div>
    </div>
  )
}
