import { primaryCourse, type CourseLessonLink, type ClassroomCourse } from '../config/classroomCourses'

/** Learner activity signals — ClassroomIO-style unit progress without a separate LMS. */
export type ProgressSignals = {
  savedWordCount: number
  hasLiveStory: boolean
  coachUsed: boolean
  shelfCount: number
}

const COACH_FLAG_KEY = 'colingual-coach-used-v1'

export function markCoachUsed(): void {
  try {
    localStorage.setItem(COACH_FLAG_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function loadCoachUsed(): boolean {
  try {
    return localStorage.getItem(COACH_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function lessonState(
  lessonId: string,
  signals: ProgressSignals,
): CourseLessonLink['state'] {
  const vocabDone = signals.savedWordCount >= 2
  const readDone = signals.hasLiveStory
  const coachDone = signals.coachUsed
  const shelfDone = signals.shelfCount >= 1

  switch (lessonId) {
    case 'l1':
      return vocabDone ? 'done' : 'current'
    case 'l2':
      if (!vocabDone) {
        return 'locked'
      }
      return readDone ? 'done' : 'current'
    case 'l3':
      if (!readDone) {
        return 'locked'
      }
      return coachDone ? 'done' : 'current'
    case 'l4':
      if (!coachDone) {
        return 'locked'
      }
      return shelfDone ? 'done' : 'current'
    default:
      return 'locked'
  }
}

export function deriveClassroomCourse(signals: ProgressSignals): ClassroomCourse {
  const unit = primaryCourse.units[0]
  const lessons = unit.lessons.map((lesson) => ({
    ...lesson,
    state: lessonState(lesson.id, signals),
  }))

  const doneCount = lessons.filter((lesson) => lesson.state === 'done').length
  const progressPct = Math.round((doneCount / lessons.length) * 100)

  return {
    ...primaryCourse,
    units: [
      { ...unit, lessons, progressPct },
      primaryCourse.units[1],
    ],
  }
}
