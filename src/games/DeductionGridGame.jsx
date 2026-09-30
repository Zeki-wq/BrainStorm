import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import { shuffle } from './rotationUtils.js'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_LEVELS = 5
const PEOPLE = ['Ali', 'Ayşe', 'Mehmet', 'Ece', 'Can']
const SETS = [
  { id: 'color', label: 'Renk', values: ['Kırmızı', 'Mavi', 'Yeşil', 'Sarı', 'Mor'] },
  { id: 'animal', label: 'Hayvan', values: ['Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Balık'] },
  { id: 'city', label: 'Şehir', values: ['İzmir', 'Ankara', 'Bursa', 'Antalya', 'Eskişehir'] },
]
const CASES = [
  ['The Lost Artifact', 'Müzedeki eser kayboldu. Üç araştırmacının renk, hayvan ve şehir bağlantılarını çöz.'],
  ['The Midnight Exhibit', 'Gece sergisindeki eşleşmeyen izleri takip et; her ipucu bir şüpheliyi eler.'],
  ['The Missing Curator', 'Küratörün son rotasını kişi, renk ve şehir kayıtlarından çıkar.'],
  ['The Glass Archive', 'Arşiv kartları karıştı. Her kayıt yalnızca bir kişiyle eşleşebilir.'],
  ['The Final Alibi', 'Son tanıkların ifadelerini karşılaştır ve tüm bağlantıları tutarlı biçimde tamamla.'],
]
const sizeFor = level => level <= 2 ? 3 : level <= 4 ? 4 : 5

function makePuzzle(level) {
  const size = sizeFor(level)
  const people = PEOPLE.slice(0, size)
  const categories = SETS.map(set => ({ ...set, values: set.values.slice(0, size), solution: shuffle(Array.from({ length: size }, (_, i) => i)) }))
  const clues = []
  categories.forEach(category => {
    const hidden = Math.floor(Math.random() * size)
    const excluded = shuffle(people.map((_, i) => i).filter(i => i !== hidden))[0]
    people.forEach((person, i) => {
      if (i !== hidden && i !== excluded) clues.push(`${person} ${category.values[category.solution[i]]} ile eşleşir.`)
    })
    clues.push(`${people[excluded]}, ${category.values[category.solution[hidden]]} ile eşleşmez.`)
  })
  return { people, categories, clues }
}

function DeductionGridGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [puzzle, setPuzzle] = useState(() => makePuzzle(1))
  const [marks, setMarks] = useState({})
  const [hints, setHints] = useState(0)
  const [hintsTotal, setHintsTotal] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [levelMistakes, setLevelMistakes] = useState(0)
  const [levelSeconds, setLevelSeconds] = useState(0)
  const [timeTotal, setTimeTotal] = useState(0)
  const [score, setScore] = useState(0)
  const [solved, setSolved] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (complete || feedback === 'solved') return undefined
    const timer = window.setInterval(() => setLevelSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [complete, feedback])
  useEffect(() => {
    if (!feedback || feedback === 'solved') return undefined
    const timer = window.setTimeout(() => setFeedback(''), 1300)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function markCell(categoryId, row, column) {
    if (feedback) return
    const key = `${categoryId}:${row}:${column}`
    const next = { ...marks, [key]: marks[key] === '' || !marks[key] ? 'check' : marks[key] === 'check' ? 'cross' : '' }
    if (next[key] === 'check') {
      const category = puzzle.categories.find(item => item.id === categoryId)
      category.values.forEach((_, c) => { if (c !== column && next[`${categoryId}:${row}:${c}`] === 'check') next[`${categoryId}:${row}:${c}`] = 'cross' })
      puzzle.people.forEach((_, r) => { if (r !== row && next[`${categoryId}:${r}:${column}`] === 'check') next[`${categoryId}:${r}:${column}`] = 'cross' })
    }
    setMarks(next)
  }

  function useHint() {
    if (feedback || hints >= 3) return
    const category = puzzle.categories[hints]
    const key = `${category.id}:0:${category.solution[0]}`
    setMarks(value => ({ ...value, [key]: 'check' }))
    setHints(value => value + 1)
    setHintsTotal(value => value + 1)
    setFeedback('Bir doğru eşleşme açıldı; puan ipucu nedeniyle azalır.')
  }

  function submit() {
    if (feedback) return
    let filled = true
    let right = true
    puzzle.categories.forEach(category => puzzle.people.forEach((_, row) => {
      const chosen = category.values.findIndex((__, col) => marks[`${category.id}:${row}:${col}`] === 'check')
      if (chosen < 0) filled = false
      if (chosen !== category.solution[row]) right = false
    }))
    if (!filled) { setFeedback('Her kişi için her tabloda bir eşleşme seç.'); return }
    if (!right) { setMistakes(n => n + 1); setLevelMistakes(n => n + 1); setFeedback('Bazı eşleşmeler ipuçlarıyla çelişiyor. İşaretlerini gözden geçir.'); return }
    const earned = Math.max(100, 1000 - levelSeconds * 4 - levelMistakes * 35 - hints * 100)
    setScore(s => s + earned); setSolved(n => n + 1); setTimeTotal(t => t + levelSeconds); setFeedback('solved')
  }

  function nextLevel() {
    const next = level + 1
    setLevel(next); setPuzzle(makePuzzle(next)); setMarks({}); setHints(0); setLevelMistakes(0); setLevelSeconds(0); setFeedback('')
  }
  function replay() {
    setLevel(1); setPuzzle(makePuzzle(1)); setMarks({}); setHints(0); setHintsTotal(0); setMistakes(0); setLevelMistakes(0); setLevelSeconds(0); setTimeTotal(0); setScore(0); setSolved(0); setFeedback(''); setComplete(false)
  }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Tamamlanan level<strong>{solved}/{TOTAL_LEVELS}</strong></span><span>Toplam süre<strong>{timeTotal} sn</strong></span><span>Hata<strong>{mistakes}</strong></span><span>Kullanılan hint<strong>{hintsTotal}</strong></span></div>

  return <GameShell title="Deduction Grid" category="Logic" score={score} accuracy={ solved + mistakes > 0 ? solved / (solved + mistakes) * 100 : null } currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${levelSeconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {feedback === 'solved' && !complete ? <section className="level-success case-solved"><p className="eyebrow">CASE SOLVED · #{String(level).padStart(3, '0')}</p><h2>{CASES[level - 1][0]}</h2><GameFeedback type="level">Bütün bağlantılar doğrulandı · +{score} skor</GameFeedback><button className="primary-button" type="button" onClick={level === TOTAL_LEVELS ? () => setComplete(true) : nextLevel}>{level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level'}</button></section> : <div className="deduction-game">
      <header className="deduction-case"><span>CASE #{String(level).padStart(3, '0')}</span><strong>{CASES[level - 1][0]}</strong><p>{CASES[level - 1][1]}</p></header>
      <p className="new-game-prompt">Level {level} · {puzzle.people.length} kişiyi ipuçlarıyla eşleştir</p>
      <div className="deduction-clues"><strong>İpuçları</strong>{puzzle.clues.map((clue, i) => <span key={`${level}-${i}`}>{clue}</span>)}</div>
      <p className="new-game-hint">Hücreye tıkla: boş → ✓ eşleşme → × elendi. Her kategori bire bir eşleşir.</p>
      <div className="deduction-tables">{puzzle.categories.map(category => <div className="deduction-table-wrap" key={category.id}><h3>{category.label}</h3><table className="deduction-table"><thead><tr><th>Kişi</th>{category.values.map(value => <th key={value}>{value}</th>)}</tr></thead><tbody>{puzzle.people.map((person, row) => <tr key={person}><th>{person}</th>{category.values.map((value, column) => { const mark = marks[`${category.id}:${row}:${column}`] || ''; return <td key={value}><button type="button" className={`deduction-cell ${mark}`} onClick={() => markCell(category.id, row, column)} aria-label={`${person}, ${value}: ${mark || 'boş'}`}>{mark === 'check' ? '✓' : mark === 'cross' ? '×' : ''}</button></td> })}</tr>)}</tbody></table></div>)}</div>
      <div className="deduction-actions"><button className="game-secondary-button" type="button" disabled={hints >= 3 || Boolean(feedback)} onClick={useHint}>Hint kullan ({hints}/3)</button><button className="primary-button" type="button" disabled={Boolean(feedback)} onClick={submit}>Çözümü kontrol et</button></div>
      <p className={`game-feedback ${feedback && feedback !== 'solved' ? 'wrong' : ''}`} aria-live="polite">{feedback === 'solved' ? 'Level tamamlandı!' : feedback}</p>
    </div>}
  </GameShell>
}

export default DeductionGridGame
