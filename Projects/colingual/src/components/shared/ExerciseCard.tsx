import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import './ExerciseCard.css'

type ExerciseCardProps = {
  children: ReactNode
  result?: 'idle' | 'correct' | 'wrong'
  cardKey: string
}

export function ExerciseCard({ children, result = 'idle', cardKey }: ExerciseCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={cardKey}
        className={[
          'exercise-card',
          result === 'correct' ? 'exercise-card--correct' : '',
          result === 'wrong' ? 'exercise-card--wrong' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={
          result === 'correct' ?
            { opacity: 0, y: -16 }
          : { opacity: 1, x: 0 }
        }
        transition={{ duration: 0.28 }}
      >
        {children}
      </motion.article>
    </AnimatePresence>
  )
}
