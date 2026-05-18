import { useEffect, useState } from 'react'
import type { CEFRLevel, Skill } from '../../types'
import { skillLabels } from '../../constants/labels'
import './SkillProgressRing.css'

const SKILL_COLORS: Record<Skill, string> = {
  reading: '#2f5fbb',
  writing: '#7c3aed',
  listening: '#ea580c',
  speaking: '#16a34a',
}

type SkillProgressRingProps = {
  skill: Skill
  percentage: number
  cefrLevel: CEFRLevel
}

export function SkillProgressRing({ skill, percentage, cefrLevel }: SkillProgressRingProps) {
  const [animated, setAnimated] = useState(0)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference
  const color = SKILL_COLORS[skill]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(percentage))
    return () => cancelAnimationFrame(frame)
  }, [percentage])

  return (
    <div className="skill-ring" aria-label={`${skillLabels[skill]} ${percentage}%`}>
      <svg width="88" height="88" viewBox="0 0 88 88" role="img">
        <circle
          className="skill-ring__track"
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          strokeWidth="8"
        />
        <circle
          className="skill-ring__progress"
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="skill-ring__label">
        <strong>{animated}%</strong>
        <span>{skillLabels[skill]}</span>
        <em>{cefrLevel}</em>
      </div>
    </div>
  )
}
