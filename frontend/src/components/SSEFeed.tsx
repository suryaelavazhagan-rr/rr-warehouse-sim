import { type OrderEvent } from '../hooks/useOrderSSE'
import { colors } from '../theme'

export function SSEFeed({ events }: { events: OrderEvent[] }) {
  return (
    <div style={{
      background: colors.bgSecondary, border: `1px solid ${colors.border}`,
      borderRadius: 4, padding: 12, maxHeight: 320, overflowY: 'auto',
    }}>
      <div style={{ color: colors.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        Live Order Events
      </div>
      {events.length === 0 && (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Waiting for events…</div>
      )}
      {[...events].reverse().map((e, i) => (
        <div key={i} style={{
          fontSize: 12, padding: '5px 0',
          borderBottom: `1px solid ${colors.border}`,
          color: e.event_type.includes('FAIL') ? colors.redBright
               : e.event_type.includes('COMPLETE') ? colors.success
               : colors.textPrimary,
        }}>
          <span style={{ color: colors.textMuted, marginRight: 8 }}>
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span style={{ color: colors.redAccent, marginRight: 8, fontWeight: 600 }}>
            [{e.event_type}]
          </span>
          {e.detail}
        </div>
      ))}
    </div>
  )
}
