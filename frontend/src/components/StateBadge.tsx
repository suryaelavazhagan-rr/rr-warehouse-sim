import { robotStatusColors, orderStatusColors, colors } from '../theme'

type BadgeType = 'robot' | 'order' | 'task' | 'line'

const taskStatusColors: Record<string, string> = {
  QUEUED:      colors.textMuted,
  IN_PROGRESS: colors.redAccent,
  COMPLETE:    colors.success,
  FAILED:      colors.redDeep,
}

const lineStatusColors: Record<string, string> = {
  PENDING:     colors.textMuted,
  IN_PROGRESS: colors.redAccent,
  FULFILLED:   colors.success,
  UNFULFILLED: colors.redDeep,
}

function getColor(status: string, type: BadgeType): string {
  if (type === 'robot') return robotStatusColors[status] || colors.textMuted
  if (type === 'order') return orderStatusColors[status] || colors.textMuted
  if (type === 'task') return taskStatusColors[status] || colors.textMuted
  if (type === 'line') return lineStatusColors[status] || colors.textMuted
  return colors.textMuted
}

export function StateBadge({ status, type = 'robot' }: { status: string; type?: BadgeType }) {
  const color = getColor(status, type)
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: color + '22', color, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}
