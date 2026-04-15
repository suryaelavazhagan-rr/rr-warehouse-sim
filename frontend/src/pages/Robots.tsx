import { useState, useEffect, useCallback } from 'react'
import { robotsApi, type RobotData } from '../api/robots'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import { RobotCard } from '../components/RobotCard'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { colors } from '../theme'

export function Robots() {
  const [robots, setRobots] = useState<RobotData[]>([])
  const [loading, setLoading] = useState(true)
  const { robotStates, allEvents, connected } = useRobotWebSocket()

  const loadRobots = useCallback(() => {
    robotsApi.list()
      .then(setRobots)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadRobots()
  }, [loadRobots])

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
            🤖 Robots
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
            {mergedRobots.length} robot{mergedRobots.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <ConnectionIndicator connected={connected} />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 64,
          color: colors.textMuted,
          fontSize: 14,
        }}>
          Loading robots…
        </div>
      )}

      {/* Empty state */}
      {!loading && mergedRobots.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 64,
          color: colors.textMuted,
          gap: 8,
        }}>
          <span style={{ fontSize: 36 }}>🤖</span>
          <span style={{ fontSize: 14 }}>No robots found</span>
        </div>
      )}

      {/* Robot grid */}
      {!loading && mergedRobots.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {mergedRobots.map(robot => {
            const recentEvents = allEvents
              .filter(e => e.robot_id === robot.id)
              .slice(0, 10)

            return (
              <RobotCard
                key={robot.id}
                robot={robot}
                recentEvents={recentEvents}
                onUpdate={loadRobots}
                compact={false}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
