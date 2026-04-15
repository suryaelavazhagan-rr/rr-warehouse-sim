export const colors = {
  bgPrimary:   '#0a0a0a',
  bgSecondary: '#111111',
  bgCard:      '#1a1a1a',
  bgHover:     '#222222',
  redPrimary:  '#e53935',
  redBright:   '#ff1744',
  redAccent:   '#ff5252',
  redDeep:     '#b71c1c',
  redMuted:    '#ffcdd2',
  textPrimary: '#ffffff',
  textMuted:   '#9e9e9e',
  border:      '#2a2a2a',
  success:     '#4caf50',
  warning:     '#ff9800',
}

export const robotStatusColors: Record<string, string> = {
  IDLE:             colors.textMuted,
  MOVING_TO_PICK:   colors.redAccent,
  PICKING_ITEM:     colors.redPrimary,
  PICKED_ITEM:      colors.redBright,
  MOVING_TO_DROP:   colors.redAccent,
  DROPPING_ITEM:    colors.redPrimary,
  MOVING_TO_CHARGE: colors.warning,
  CHARGING:         colors.warning,
  MOVING_TO_REST:   '#555555',
  RESTING:          '#444444',
  ERROR:            colors.redDeep,
}

export const orderStatusColors: Record<string, string> = {
  PENDING:  colors.textMuted,
  PICKING:  colors.redAccent,
  COMPLETE: colors.success,
  PARTIAL:  colors.warning,
  FAILED:   colors.redDeep,
}
