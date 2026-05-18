import { SKILLS } from '../../types'
import { t } from '../../constants/labels'
import { useProgressStore } from '../../stores/useProgressStore'
import { CEFRRoadmap } from './CEFRRoadmap'
import { SkillProgressRing } from './SkillProgressRing'
import { SkillRadarChart } from './SkillRadarChart'
import { DailyPlanCard } from '../gamification/DailyPlanCard'
import { BadgeGrid } from '../gamification/BadgeGrid'
import './CEFRDashboardSection.css'

type CEFRDashboardSectionProps = {
  onNavigateLevel?: (level: string) => void
}

export function CEFRDashboardSection({ onNavigateLevel }: CEFRDashboardSectionProps) {
  const progress = useProgressStore((state) => state.progress)
  const earnedBadges = useProgressStore((state) => state.earnedBadges)
  const setCurrentLevel = useProgressStore((state) => state.setCurrentLevel)

  return (
    <section className="panel cefr-dashboard" id="cefr-dashboard" aria-labelledby="cefr-dashboard-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">{t('dashboard.subtitle')}</p>
          <h2 id="cefr-dashboard-title">{t('dashboard.title')}</h2>
        </div>
      </header>

      <CEFRRoadmap
        currentLevel={progress.currentLevel}
        onSelectLevel={(level) => {
          setCurrentLevel(level)
          onNavigateLevel?.(level)
        }}
      />

      <div className="cefr-dashboard__rings">
        {SKILLS.map((skill) => (
          <SkillProgressRing
            key={skill}
            skill={skill}
            percentage={progress.skills[skill].percentage}
            cefrLevel={progress.skills[skill].level}
          />
        ))}
      </div>

      <div className="cefr-dashboard__grid">
        <SkillRadarChart progress={progress} />
        <DailyPlanCard />
      </div>

      <BadgeGrid earnedIds={earnedBadges} />
    </section>
  )
}
