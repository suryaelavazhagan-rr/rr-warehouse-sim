import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Items } from './pages/Items'
import { Inventory } from './pages/Inventory'
import { Orders } from './pages/Orders'
import { OrderDetail } from './pages/OrderDetail'
import { Robots } from './pages/Robots'
import { colors } from './theme'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        display: 'flex', minHeight: '100vh',
        backgroundColor: colors.bgPrimary, color: colors.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/items" element={<Items />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/robots" element={<Robots />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
