import { useEffect, useRef, useState } from 'react'
import { levelFromTotalXp, xpProgressInLevel } from '../services/xpSystem'
import { useProgressStore } from '../stores/useProgressStore'

export function useXpLevelUp() {
  const totalXP = useProgressStore((state) => state.progress.totalXP)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const previousLevel = useRef(levelFromTotalXp(totalXP))

  useEffect(() => {
    const current = levelFromTotalXp(totalXP)
    if (current > previousLevel.current) {
      setShowLevelUp(true)
    }
    previousLevel.current = current
  }, [totalXP])

  const progress = xpProgressInLevel(totalXP)

  return {
    level: progress.level,
    xpProgress: progress,
    showLevelUp,
    dismissLevelUp: () => setShowLevelUp(false),
  }
}
