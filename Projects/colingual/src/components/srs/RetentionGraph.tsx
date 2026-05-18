import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSRSStore } from '../../stores/useSRSStore'
import './RetentionGraph.css'

export function RetentionGraph() {
  const history = useSRSStore((state) => state.retentionHistory)

  if (history.length === 0) {
    return (
      <p className="retention-graph__empty">Son 30 günlük retention verisi henüz yok.</p>
    )
  }

  return (
    <div className="retention-graph" aria-label="Retention grafiği">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,32,43,0.08)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="rate" stroke="#2f5fbb" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
