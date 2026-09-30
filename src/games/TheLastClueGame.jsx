import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { shuffle } from '../utils/gameRandom.js'

const cases = [
  { name: 'The Lost Parcel', ask: 'Paketi en son hangi kurye teslim etti?', people: ['Ece', 'Bora', 'Deniz'] },
  { name: 'Lab Sample 04', ask: 'Örneği ilk işleyen araştırmacı kimdi?', targetIndex: 0, people: ['Mina', 'Aras', 'Defne', 'Can'] },
  { name: 'Platform 6', ask: 'Dört yolcu arasında üçüncü sırada kim bindi?', targetIndex: 2, people: ['Selin', 'Emir', 'Lara', 'Kerem'] },
  { name: 'Race Split', ask: 'Yarışı liderin hemen ardından kim tamamladı?', targetIndex: 1, people: ['Ada', 'Mert', 'İpek', 'Eren', 'Suna'] },
  { name: 'Gallery Log', ask: 'Kayıt defterine son girişi kim yaptı?', targetIndex: 4, people: ['Duru', 'Kaan', 'Naz', 'Umut', 'Pelin'] },
]

function makeCase(index) {
  const scenario = cases[index]
  const order = shuffle(scenario.people)
  const pairFacts = []
  for (let first = 0; first < order.length; first += 1) {
    for (let second = first + 1; second < order.length; second += 1) {
      pairFacts.push({ first, second, text: `${order[first]} ${first === 0 && second === order.length - 1 ? 'çok daha önce' : 'önce'} geldi ${order[second]}.` })
    }
  }
  const desired = Math.min(pairFacts.length, index === 4 ? 8 : index + 3)
  const chainFacts = pairFacts.filter(fact => fact.second === fact.first + 1)
  const extra = shuffle(pairFacts.filter(fact => fact.second > fact.first + 1))
  const clueList = shuffle([...chainFacts, ...extra.slice(0, Math.max(0, desired - chainFacts.length))].map(fact => fact.text))
  return { ...scenario, people: shuffle(scenario.people), answer: order[scenario.targetIndex ?? order.length - 1], clues: clueList, level: index + 1 }
}

function TheLastClueGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [puzzle, setPuzzle] = useState(() => makeCase(0))
  const [shown, setShown] = useState(2)
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [levelElapsed, setLevelElapsed] = useState(0)
  const [feedback, setFeedback] = useState('Karşılaştırmaları sıraya koy; gerekirse yeni ipucu iste.')
  const complete = round >= cases.length

  useEffect(() => {
    if (complete) return undefined
    const timer = window.setInterval(() => { setElapsed(value => value + 0.25); setLevelElapsed(value => value + 0.25) }, 250)
    return () => window.clearInterval(timer)
  }, [complete])

  function reveal() {
    if (solved || shown >= puzzle.clues.length) return
    setShown(value => value + 1)
    setTotalHintsUsed(value => value + 1)
    setScore(value => Math.max(0, value - 15))
    setFeedback('Yeni ipucu eklendi · dikkatle karşılaştır.')
    playSfx('clue')
  }

  function answer(person) {
    if (solved || complete) return
    if (person === puzzle.answer) {
      const gained = Math.max(60, 180 - Math.round(levelElapsed * 3))
      setScore(value => value + gained)
      setCorrect(value => value + 1)
      setSolved(true)
      setFeedback('Zaman sırası çözüldü!')
      playSfx('levelComplete')
    } else {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 25))
      setFeedback(`${person} bu ipuçlarıyla uyuşmuyor. Yeniden değerlendir.`)
      playSfx('wrong')
    }
  }

  function nextCase() {
    const next = round + 1
    setRound(next)
    if (next < cases.length) { setPuzzle(makeCase(next)); setShown(2); setSolved(false); setLevelElapsed(0); setFeedback('Karşılaştırmaları sıraya koy; gerekirse yeni ipucu iste.') }
  }
  function replay() { setRound(0); setPuzzle(makeCase(0)); setShown(2); setSolved(false); setScore(0); setCorrect(0); setErrors(0); setTotalHintsUsed(0); setElapsed(0); setLevelElapsed(0); setFeedback('Karşılaştırmaları sıraya koy; gerekirse yeni ipucu iste.') }

  return <GameShell title="The Last Clue" category="Problem Solving / Deduction" score={score} currentRound={complete ? cases.length : round + 1} totalRounds={cases.length} isComplete={complete} accuracy={correct + errors ? correct / (correct + errors) * 100 : null} result={`CASE FILES CLOSED · ${correct}/${cases.length} çözüldü · ${errors} yanlış · ${totalHintsUsed} ipucu · ${elapsed} sn`} onReplay={replay} onBack={onBack}>
    {!complete && <div className="last-clue-game">
      <div className="last-clue-top"><span>CASE #{String(round + 1).padStart(3, '0')}</span><span>LEVEL {round + 1} / 5</span><span>{elapsed}s</span></div>
      <header className="last-clue-case"><span aria-hidden="true">⌕</span><div><small>OLAY DOSYASI</small><h2>{puzzle.name}</h2></div></header>
      <section className="last-clue-board"><div className="last-clue-board-title"><strong>SAAT SIRASI</strong><span>{shown}/{puzzle.clues.length} ipucu</span></div>
        <ol>{puzzle.clues.slice(0, shown).map((clue, index) => <li key={`${clue}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{clue}</li>)}</ol>
        {!solved && shown < puzzle.clues.length && <button type="button" className="last-clue-reveal" onClick={reveal}>Bir ipucu daha aç <small>−15 puan</small></button>}
      </section>
      <p className="last-clue-question">{puzzle.ask}</p><p className="last-clue-feedback" aria-live="polite">{feedback}</p>
      <p className="game-skill-note">Zaman karşılaştırmalarını birleştirerek sonucu çıkar; yanlış seçim yeniden düşünmen için işaret verir.</p>
      <div className="last-clue-people">{puzzle.people.map((person, index) => <button type="button" key={person} disabled={solved} onClick={() => answer(person)}><span>0{index + 1}</span><strong>{person}</strong><small>{solved && person === puzzle.answer ? 'SON GELEN' : 'KİŞİYİ İNCELE'}</small></button>)}</div>
      {solved && <div className="last-clue-solved" role="status"><strong>CASE SOLVED</strong><span>{puzzle.answer} son sırada · +puan</span><button type="button" onClick={nextCase}>{round === cases.length - 1 ? 'Dosyaları kapat' : 'Sonraki dosya'} →</button></div>}
      <p className="last-clue-tip">Zaman ipuçlarını zincirle. İpucu açmak çözümü kolaylaştırır ama puan bonusunu azaltır.</p>
    </div>}
  </GameShell>
}

export default TheLastClueGame

