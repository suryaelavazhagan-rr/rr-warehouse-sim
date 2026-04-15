import { colors } from '../theme'

export function BatteryBar({ level }: { level: number }) {
  const color = level < 20 ? colors.redBright : level < 40 ? colors.warning : colors.redPrimary
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: colors.border, borderRadius: 3 }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, level))}%`,
          height: '100%', background: color, borderRadius: 3,
          transition: 'width 0.5s ease, background 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, color: colors.textMuted, minWidth: 42, textAlign: 'right' }}>
        {level.toFixed(1)}%
      </span>
    </div>
  )
}
