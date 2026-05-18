import { t } from '../../constants/labels'
import { useProgressStore } from '../../stores/useProgressStore'
import './DailyMissions.css'

const MISSIONS = [
  { id: 'read', label: '1 okuma metni bitir', skill: 'reading' as const },
  { id: 'speak', label: '3 konuşma egzersizi', skill: 'speaking' as const },
  { id: 'words', label: '5 yeni kelime kaydet', skill: 'writing' as const },
]

export function DailyMissions() {
  const skills = useProgressStore((state) => state.progress.skills)

  return (
    <section className="daily-missions panel" aria-labelledby="daily-missions-title">
      <h3 id="daily-missions-title">{t('missions.title')}</h3>
      <ul>
        {MISSIONS.map((mission) => {
          const done =
            mission.id === 'read' ?
              skills.reading.totalSessions > 0
            : mission.id === 'speak' ?
              skills.speaking.totalSessions >= 1
            : skills.writing.percentage >= 20
          return (
            <li key={mission.id} className={done ? 'daily-missions__done' : ''}>
              <span>{mission.label}</span>
              <em>{done ? 'Tamam' : 'Devam'}</em>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
