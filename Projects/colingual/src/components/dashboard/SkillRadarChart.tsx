import { useMemo } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { UserProgress } from '../../types'
import { skillLabels } from '../../constants/labels'
import './SkillRadarChart.css'

type SkillRadarChartProps = {
  progress: UserProgress
}

export function SkillRadarChart({ progress }: SkillRadarChartProps) {
  const data = useMemo(
    () =>
      (['reading', 'writing', 'listening', 'speaking'] as const).map((skill) => ({
        skill: skillLabels[skill],
        value: progress.skills[skill].percentage,
      })),
    [progress],
  )

  return (
    <div className="skill-radar" aria-label="Beceri radar grafiği">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(21,32,43,0.12)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#667085', fontSize: 12 }} />
          <Radar
            name="İlerleme"
            dataKey="value"
            stroke="#2f5fbb"
            fill="#2f5fbb"
            fillOpacity={0.35}
            isAnimationActive
            animationDuration={800}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
