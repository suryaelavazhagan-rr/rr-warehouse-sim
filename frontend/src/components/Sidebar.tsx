import { NavLink } from 'react-router-dom'
import { colors } from '../theme'
import rapyutaLogo from '../assets/rapyuta_logo.png'

const links = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/items',     label: '📦 Items' },
  { to: '/inventory', label: '🗃️ Inventory' },
  { to: '/orders',    label: '🛒 Orders' },
  { to: '/robots',    label: '🤖 Robots' },
]

export function Sidebar() {
  return (
    <nav style={{
      width: 220, minHeight: '100vh', backgroundColor: colors.bgSecondary,
      borderRight: `1px solid ${colors.border}`, padding: '0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <img
          src={rapyutaLogo}
          alt="Rapyuta Robotics"
          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
        />
        <span style={{ color: colors.redPrimary, fontSize: 14, fontWeight: 700, letterSpacing: 1.5 }}>
          RR WAREHOUSE
        </span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'block', padding: '12px 16px', textDecoration: 'none',
            color: isActive ? colors.redBright : colors.textMuted,
            borderLeft: isActive ? `3px solid ${colors.redPrimary}` : '3px solid transparent',
            backgroundColor: isActive ? `${colors.redDeep}22` : 'transparent',
            fontSize: 14, transition: 'all 0.15s',
          })}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
