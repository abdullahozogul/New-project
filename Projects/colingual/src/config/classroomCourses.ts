/**
 * Course-style learning paths inspired by ClassroomIO (classroomio/classroomio):
 * open education units that map to Colingual views instead of a separate LMS app.
 */

export type CourseLessonLink = {
  id: string
  title: string
  category: string
  description?: string
  state: 'done' | 'current' | 'locked'
  /** In-app destination */
  href: string
}

export type CourseUnit = {
  id: string
  label: string
  title: string
  description: string
  progressPct: number
  lessons: CourseLessonLink[]
}

export type ClassroomCourse = {
  id: string
  title: string
  role: 'student' | 'educator'
  units: CourseUnit[]
}

export const primaryCourse: ClassroomCourse = {
  id: 'colingual-news-track',
  title: 'Günlük haber okuma',
  role: 'student',
  units: [
    {
      id: 'u1',
      label: 'Ünite 1',
      title: 'Temel okuma ve haber',
      description:
        'CEFR seviyeli metinler, kelime kaydı ve koç sohbeti — ClassroomIO ünite akışına benzer ilerleme.',
      progressPct: 80,
      lessons: [
        {
          id: 'l1',
          category: 'Kelime',
          title: 'Temel kelimeler',
          state: 'done',
          href: '#practice',
        },
        {
          id: 'l2',
          category: 'Okuma',
          title: 'Canlı haber masası',
          description: 'Soldan hikâye, üstten A1–C1 seviye.',
          state: 'current',
          href: '#read',
        },
        {
          id: 'l3',
          category: 'Konuşma',
          title: 'Koç ile pratik',
          state: 'locked',
          href: '#practice',
        },
        {
          id: 'l4',
          category: 'Kütüphane',
          title: 'ScholarShelf rafı',
          description: 'Kaydettiğiniz hikâyelerden soru sorun.',
          state: 'locked',
          href: '#library',
        },
      ],
    },
    {
      id: 'u2',
      label: 'Ünite 2 • Kilitli',
      title: 'İleri analiz ve tartışma',
      description: 'Ünite 1 tamamlanınca açılır.',
      progressPct: 0,
      lessons: [],
    },
  ],
}
