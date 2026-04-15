import { type RobotData, robotsApi } from '../api/robots'
import { type RobotEvent } from '../hooks/useRobotWebSocket'
import { StateBadge } from './StateBadge'
import { BatteryBar } from './BatteryBar'
import { colors } from '../theme'

interface Props {
  robot: RobotData
  recentEvents?: RobotEvent[]
  onUpdate: () => void
  compact?: boolean
}

export function RobotCard({ robot, recentEvents = [], onUpdate, compact = false }: Props) {
  const canCharge = ['IDLE', 'RESTING'].includes(robot.status)
  const canReset = robot.status === 'ERROR'

  const handleCharge = async () => {
    try { await robotsApi.charge(robot.id); onUpdate() } catch (e) { console.error(e) }
  }
  const handleReset = async () => {
    try { await robotsApi.reset(robot.id); onUpdate() } catch (e) { console.error(e) }
  }

  return (
    <div style={{
      background: colors.bgCard, border: `1px solid ${robot.status === 'ERROR' ? colors.redDeep : colors.border}`,
      borderRadius: 8, padding: compact ? 12 : 16,
      boxShadow: robot.status === 'ERROR' ? `0 0 12px ${colors.redDeep}44` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, color: colors.textPrimary, fontSize: compact ? 13 : 15 }}>
          {robot.name}
        </span>
        <StateBadge status={robot.status} type="robot" />
      </div>

      <BatteryBar level={robot.battery_level} />

      {!compact && (
        <div style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>
          Task: {robot.current_task_id ? robot.current_task_id.slice(0, 8) + '…' : '—'}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          disabled={!canCharge}
          onClick={handleCharge}
          style={{
            padding: '5px 10px', fontSize: 11, cursor: canCharge ? 'pointer' : 'not-allowed',
            borderRadius: 4, border: 'none',
            background: canCharge ? colors.warning : colors.border,
            color: canCharge ? '#000' : colors.textMuted,
            opacity: canCharge ? 1 : 0.5,
          }}>
          ⚡ Charge
        </button>
        <button
          disabled={!canReset}
          onClick={handleReset}
          style={{
            padding: '5px 10px', fontSize: 11, cursor: canReset ? 'pointer' : 'not-allowed',
            borderRadius: 4, border: 'none',
            background: canReset ? colors.redDeep : colors.border,
            color: 'white', opacity: canReset ? 1 : 0.5,
          }}>
          🔄 Reset
        </button>
      </div>

      {!compact && recentEvents.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Recent transitions</div>
          {recentEvents.slice(0, 10).map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: colors.textMuted, padding: '2px 0',
                                   display: 'flex', justifyContent: 'space-between' }}>
              <span>{e.from_state} → {e.to_state}</span>
              <span style={{ color: colors.border }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
