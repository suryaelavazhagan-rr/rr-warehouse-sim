import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { robotsApi, type RobotData } from '../api/robots'
import { ordersApi, type Order } from '../api/orders'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import { RobotCard } from '../components/RobotCard'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { StateBadge } from '../components/StateBadge'
import { colors } from '../theme'

const INACTIVE_STATUSES = new Set(['IDLE', 'RESTING', 'CHARGING'])

function isActive(status: string): boolean {
  return !INACTIVE_STATUSES.has(status)
}

interface StatCardProps {
  label: string
  value: number | string
  accent?: boolean
  warning?: boolean
  danger?: boolean
}

function StatCard({ label, value, accent, warning, danger }: StatCardProps) {
  const valueColor = danger
    ? colors.redBright
    : warning
    ? colors.warning
    : accent
    ? colors.redAccent
    : colors.textPrimary

  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: '16px 20px',
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{
        fontSize: 28,
        fontWeight: 800,
        color: valueColor,
        lineHeight: 1,
        marginBottom: 6,
        letterSpacing: '-1px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [robots, setRobots] = useState<RobotData[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const { robotStates, connected } = useRobotWebSocket()

  const loadData = useCallback(() => {
    Promise.all([robotsApi.list(), ordersApi.list()])
      .then(([r, o]) => { setRobots(r); setOrders(o) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10_000)
    return () => clearInterval(interval)
  }, [loadData])

  // Merge API data with live WS state
  const mergedRobots: RobotData[] = robots.map(robot => {
    const wsState = robotStates[robot.id]
    if (!wsState) return robot
    return {
      ...robot,
      battery_level: wsState.battery_level,
      status: wsState.to_state,
    }
  })

  // Stats
  const totalRobots = mergedRobots.length
  const activeRobots = mergedRobots.filter(r => isActive(r.status)).length
  const errorRobots = mergedRobots.filter(r => r.status === 'ERROR').length

  // Orders today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today).length

  // Recent orders: last 10 sorted by created desc
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div style={{ color: colors.textPrimary }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Dashboard
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
            Live warehouse overview
          </p>
        </div>
        <ConnectionIndicator connected={connected} />
      </div>

      {/* Summary stat row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}>
        <StatCard label="Total Robots" value={totalRobots} />
        <StatCard label="Active Robots" value={activeRobots} accent />
        <StatCard label="Orders Today" value={ordersToday} />
        <StatCard label="Errors" value={errorRobots} danger={errorRobots > 0} />
      </div>

      {/* Robot grid (compact) */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: 14,
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}>
          Robots
        </h3>
        {mergedRobots.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: 13,
            background: colors.bgCard,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}>
            No robots registered
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {mergedRobots.map(robot => (
              <RobotCard
                key={robot.id}
                robot={robot}
                onUpdate={loadData}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent orders panel */}
      <div>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: 14,
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}>
          Recent Orders
        </h3>
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {recentOrders.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: 13,
            }}>
              No orders yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Name', 'Status', 'Shortfall Mode', 'Created'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      color: colors.textMuted,
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: colors.textPrimary }}>
                      {order.name}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StateBadge status={order.status} type="order" />
                    </td>
                    <td style={{ padding: '10px 14px', color: colors.textMuted, fontFamily: 'monospace', fontSize: 12 }}>
                      {order.shortfall_mode}
                    </td>
                    <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
