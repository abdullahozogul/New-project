import type { Level } from '../../data'
import { languages, learningGoals, levels } from '../../data'

type LearnerSetupStripProps = {
  nativeLanguage: string
  targetLanguage: string
  level: Level
  goal: string
  /** CEFR levels available for the story currently open in the reader. */
  availableLevels?: Level[]
  onNativeChange: (code: string) => void
  onTargetChange: (code: string) => void
  onLevelChange: (level: Level) => void
  onGoalChange: (goal: string) => void
}

export function LearnerSetupStrip({
  nativeLanguage,
  targetLanguage,
  level,
  goal,
  availableLevels = levels,
  onNativeChange,
  onTargetChange,
  onLevelChange,
  onGoalChange,
}: LearnerSetupStripProps) {
  return (
    <section className="setup-strip" aria-label="Öğrenme ayarları">
      <label>
        <span>Ana dil</span>
        <select value={nativeLanguage} onChange={(event) => onNativeChange(event.target.value)}>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Hedef dil</span>
        <select value={targetLanguage} onChange={(event) => onTargetChange(event.target.value)}>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </label>

      <div className="level-control-wrap">
        <span className="level-control-label">Okuma seviyesi</span>
        <div className="level-control" aria-label="Seçili hikâyenin CEFR seviyesi">
          {levels.map((candidate) => {
            const enabled = availableLevels.includes(candidate)
            const isActive = enabled && candidate === level
            return (
              <button
                key={candidate}
                type="button"
                className={isActive ? 'active' : ''}
                disabled={!enabled}
                aria-pressed={isActive}
                title={
                  enabled ?
                    `${candidate} sürümünü oku`
                  : 'Bu hikâye için bu seviye henüz yok'
                }
                onClick={() => onLevelChange(candidate)}
              >
                {candidate}
              </button>
            )
          })}
        </div>
      </div>

      <label>
        <span>Hedef</span>
        <select value={goal} onChange={(event) => onGoalChange(event.target.value)}>
          {learningGoals.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
