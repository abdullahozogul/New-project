import { useMemo, useState } from 'react'
import type { VocabularyItem } from '../../data'
import type { Skill } from '../../types'
import { useSRSStore } from '../../stores/useSRSStore'
import { levelFromAppLevel } from '../../utils/cefrUtils'
import type { Level } from '../../data'
import { TTSPlayer } from '../audio/TTSPlayer'
import './VocabularyBank.css'

type VocabularyBankProps = {
  words: VocabularyItem[]
  defaultLevel: Level
  language?: string
  learnedSkill?: Skill
}

export function VocabularyBank({
  words,
  defaultLevel,
  language = 'en',
  learnedSkill = 'reading',
}: VocabularyBankProps) {
  const [skillFilter, setSkillFilter] = useState<Skill | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all')
  const [selected, setSelected] = useState<VocabularyItem | null>(null)
  const addCard = useSRSStore((state) => state.addCard)

  const filtered = useMemo(() => {
    return words.filter(() => {
      if (skillFilter !== 'all' && learnedSkill !== skillFilter) {
        return false
      }
      if (levelFilter !== 'all' && defaultLevel !== levelFilter) {
        return false
      }
      return true
    })
  }, [words, skillFilter, levelFilter, learnedSkill, defaultLevel])

  const queueForReview = (word: VocabularyItem) => {
    addCard({
      id: `vb-${word.term}-${Date.now()}`,
      skill: learnedSkill,
      cefrLevel: levelFromAppLevel(defaultLevel),
      front: word.term,
      back: word.meaning,
    })
  }

  return (
    <section className="panel vocabulary-bank" aria-labelledby="vocab-bank-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Kelime bankası</p>
          <h2 id="vocab-bank-title">Kayıtlı kelimeler</h2>
        </div>
        <span className="count-pill">{filtered.length}</span>
      </header>

      <div className="vocabulary-bank__filters">
        <select
          value={skillFilter}
          onChange={(event) => setSkillFilter(event.target.value as Skill | 'all')}
          aria-label="Beceri filtresi"
        >
          <option value="all">Tüm beceriler</option>
          <option value="reading">Okuma</option>
          <option value="writing">Yazma</option>
          <option value="listening">Dinleme</option>
          <option value="speaking">Konuşma</option>
        </select>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value as Level | 'all')}
          aria-label="Seviye filtresi"
        >
          <option value="all">Tüm seviyeler</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
        </select>
      </div>

      <ul className="vocabulary-bank__list">
        {filtered.map((word) => (
          <li key={word.term}>
            <button type="button" onClick={() => setSelected(word)}>
              {word.term}
            </button>
            <button type="button" onClick={() => queueForReview(word)}>
              Tekrar çalış
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <dialog open className="vocabulary-bank__modal">
          <article>
            <div className="vocabulary-bank__modal-head">
              <h3>{selected.term}</h3>
              <TTSPlayer
                text={selected.term}
                language={language}
                useCase="word_definition"
                variant="icon"
              />
            </div>
            <p>{selected.meaning}</p>
            <p>
              <em>/{selected.pronunciation}/</em>
            </p>
            <p>{selected.example}</p>
            <button type="button" onClick={() => setSelected(null)}>
              Kapat
            </button>
          </article>
        </dialog>
      ) : null}
    </section>
  )
}
