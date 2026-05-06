import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Brain,
  Headphones,
  MessageSquareText,
  PlayCircle,
  TrendingUp,
} from 'lucide-react'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export type LanguageOption = {
  code: string
  label: string
  locale: string
}

export type VocabularyItem = {
  term: string
  meaning: string
  pronunciation: string
  example: string
}

export type Article = {
  id: string
  level: Level
  category: string
  title: string
  deck: string
  minutes: number
  listening: string
  video: string
  imageTone: 'mint' | 'coral' | 'blue' | 'gold' | 'violet'
  paragraphs: string[]
  vocabulary: VocabularyItem[]
}

export type ProgressMetric = {
  label: string
  value: string
  change: string
  icon: LucideIcon
}

export type PracticeModule = {
  label: string
  detail: string
  progress: number
  icon: LucideIcon
}

export const languages: LanguageOption[] = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'tr', label: 'Turkish', locale: 'tr-TR' },
  { code: 'es', label: 'Spanish', locale: 'es-ES' },
  { code: 'fr', label: 'French', locale: 'fr-FR' },
  { code: 'de', label: 'German', locale: 'de-DE' },
  { code: 'it', label: 'Italian', locale: 'it-IT' },
  { code: 'ja', label: 'Japanese', locale: 'ja-JP' },
]

export const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export const learningGoals = [
  'Daily confidence',
  'Travel conversations',
  'Academic reading',
  'Business fluency',
]

export const articles: Article[] = [
  {
    id: 'city-garden-a1',
    level: 'A1',
    category: 'Community',
    title: 'A New Garden Opens in the City',
    deck: 'Short sentences for first daily news reading.',
    minutes: 4,
    listening: 'Slow voice',
    video: 'Street clip',
    imageTone: 'mint',
    paragraphs: [
      'A new garden opens in the city today. People can walk, sit, and read there.',
      'The garden has trees, small flowers, and a place for children. It is quiet in the morning.',
      'City workers say the garden helps people meet. Many families visit after school.',
    ],
    vocabulary: [
      {
        term: 'garden',
        meaning: 'a place with plants and flowers',
        pronunciation: 'gar-den',
        example: 'We read in the garden.',
      },
      {
        term: 'quiet',
        meaning: 'not noisy',
        pronunciation: 'kwy-et',
        example: 'The morning is quiet.',
      },
      {
        term: 'visit',
        meaning: 'to go and see a place or person',
        pronunciation: 'viz-it',
        example: 'Families visit the garden.',
      },
    ],
  },
  {
    id: 'train-service-a2',
    level: 'A2',
    category: 'Transport',
    title: 'Night Trains Return This Summer',
    deck: 'Practical travel vocabulary with familiar grammar.',
    minutes: 5,
    listening: 'Clear voice',
    video: 'Station update',
    imageTone: 'blue',
    paragraphs: [
      'The national train company will bring back night trains in June. The first route will connect three large cities.',
      'Passengers can buy a seat or a small sleeping room. Tickets will be cheaper on weekdays.',
      'The company says night trains can help travelers save hotel money and reduce traffic on busy roads.',
    ],
    vocabulary: [
      {
        term: 'route',
        meaning: 'the way from one place to another',
        pronunciation: 'root',
        example: 'The route connects three cities.',
      },
      {
        term: 'passenger',
        meaning: 'a person traveling in a vehicle',
        pronunciation: 'pas-en-jer',
        example: 'Passengers can buy tickets online.',
      },
      {
        term: 'weekday',
        meaning: 'Monday through Friday',
        pronunciation: 'week-day',
        example: 'Tickets are cheaper on weekdays.',
      },
    ],
  },
  {
    id: 'food-waste-b1',
    level: 'B1',
    category: 'Environment',
    title: 'Restaurants Share Leftover Food With Students',
    deck: 'Intermediate article with cause and effect language.',
    minutes: 7,
    listening: 'News voice',
    video: 'Interview',
    imageTone: 'coral',
    paragraphs: [
      'Several restaurants have started a program that gives unsold meals to university students at the end of the day.',
      'The project reduces food waste and supports students who need affordable dinners. Volunteers collect the meals and deliver them to campus centers.',
      'Restaurant owners say the system is simple because an app shows how many portions are available each evening.',
    ],
    vocabulary: [
      {
        term: 'leftover',
        meaning: 'food that remains after a meal or sale',
        pronunciation: 'left-oh-ver',
        example: 'The restaurant shared leftover meals.',
      },
      {
        term: 'affordable',
        meaning: 'not too expensive',
        pronunciation: 'a-for-da-ble',
        example: 'Students need affordable dinners.',
      },
      {
        term: 'portion',
        meaning: 'an amount of food for one person',
        pronunciation: 'por-shun',
        example: 'The app shows available portions.',
      },
    ],
  },
  {
    id: 'ai-museum-b2',
    level: 'B2',
    category: 'Culture',
    title: 'Museums Use AI Guides to Personalize Visits',
    deck: 'Longer clauses, contrast, and technology vocabulary.',
    minutes: 8,
    listening: 'Natural voice',
    video: 'Gallery tour',
    imageTone: 'violet',
    paragraphs: [
      'A group of museums is testing AI guides that adapt explanations to each visitor. The guide can simplify a painting description for children or provide deeper historical context for specialists.',
      'Curators believe the technology may make collections more accessible, although they still review every script before it reaches the public.',
      'Early visitors say the guides feel useful when they ask follow-up questions, but some prefer human staff for emotional stories and local details.',
    ],
    vocabulary: [
      {
        term: 'adapt',
        meaning: 'to change something for a situation',
        pronunciation: 'a-dapt',
        example: 'The guide can adapt explanations.',
      },
      {
        term: 'curator',
        meaning: 'a person who manages a museum collection',
        pronunciation: 'kyur-ay-ter',
        example: 'Curators review every script.',
      },
      {
        term: 'accessible',
        meaning: 'easy for people to use or understand',
        pronunciation: 'ak-ses-i-ble',
        example: 'The tool makes collections accessible.',
      },
    ],
  },
  {
    id: 'coastal-research-c1',
    level: 'C1',
    category: 'Science',
    title: 'Coastal Researchers Map Microclimate Changes',
    deck: 'Advanced reading with abstract nouns and reporting verbs.',
    minutes: 10,
    listening: 'Full speed',
    video: 'Research brief',
    imageTone: 'gold',
    paragraphs: [
      'A coastal research team has released a detailed map showing how neighborhoods only a few kilometers apart are experiencing sharply different microclimate patterns.',
      'The scientists argue that city planners often rely on regional forecasts that conceal local heat, humidity, and wind conditions. Their sensors recorded differences large enough to influence housing design and emergency planning.',
      'The findings have prompted officials to reconsider tree coverage targets, drainage investments, and the placement of cooling centers during prolonged heat events.',
    ],
    vocabulary: [
      {
        term: 'microclimate',
        meaning: 'the climate of a small, specific area',
        pronunciation: 'my-kroh-kly-met',
        example: 'The study maps microclimate changes.',
      },
      {
        term: 'conceal',
        meaning: 'to hide or make difficult to see',
        pronunciation: 'kun-seel',
        example: 'Regional forecasts can conceal local heat.',
      },
      {
        term: 'prolonged',
        meaning: 'lasting for a long time',
        pronunciation: 'pro-longd',
        example: 'Cooling centers open during prolonged heat.',
      },
    ],
  },
]

export const progressMetrics: ProgressMetric[] = [
  { label: 'Reading streak', value: '9 days', change: '+3 this week', icon: TrendingUp },
  { label: 'Saved words', value: '42', change: '12 due today', icon: Brain },
  { label: 'Listening time', value: '3h 20m', change: '+35m today', icon: Headphones },
  { label: 'Chat turns', value: '86', change: '18 corrected', icon: MessageSquareText },
]

export const practiceModules: PracticeModule[] = [
  {
    label: 'Daily reading',
    detail: 'Level-matched articles',
    progress: 72,
    icon: BookOpen,
  },
  {
    label: 'Listening',
    detail: 'Audio and shadowing',
    progress: 58,
    icon: PlayCircle,
  },
  {
    label: 'Vocabulary',
    detail: 'Spaced review queue',
    progress: 46,
    icon: Brain,
  },
  {
    label: 'Conversation',
    detail: 'Guided chat practice',
    progress: 64,
    icon: MessageSquareText,
  },
]
