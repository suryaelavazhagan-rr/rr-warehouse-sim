import { colors } from '../theme'

export function ConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: connected ? colors.success : colors.redPrimary,
        boxShadow: connected ? `0 0 6px ${colors.success}` : `0 0 6px ${colors.redPrimary}`,
      }} />
      <span style={{ color: connected ? colors.success : colors.redPrimary }}>
        {connected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  )
}
