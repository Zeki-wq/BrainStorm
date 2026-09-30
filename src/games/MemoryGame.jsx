import { useEffect, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_LEVELS = 6
const FACES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
const pairsFor = level => Math.min(4 + level, FACES.length)
const columnsFor = pairs => pairs <= 6 ? 4 : pairs <= 8 ? 4 : pairs <= 10 ? 5 : 6
const timeFor = level => Math.max(35, 82 - level * 7)
const shuffle = values => {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
function makeDeck(level) {
  const faces = shuffle(FACES).slice(0, pairsFor(level))
  return shuffle([...faces, ...faces].map((face, index) => ({ id: `${level}-${index}-${Math.random()}`, face })))
}

function MemoryGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [deck, setDeck] = useState(() => makeDeck(1))
  const [opened, setOpened] = useState([])
  const [matched, setMatched] = useState([])
  const [seconds, setSeconds] = useState(timeFor(1))
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [errors, setErrors] = useState(0)
  const [locked, setLocked] = useState(false)
  const [phase, setPhase] = useState('playing')
  const [complete, setComplete] = useState(false)
  const timerRef = useRef(null)
  const pairs = pairsFor(level)

  useEffect(() => {
    if (phase !== 'playing') return undefined
    timerRef.current = window.setTimeout(() => {
      if (seconds <= 1) { setSeconds(0); setPhase('failed'); setCombo(0); playSfx('gameOver') }
      else setSeconds(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timerRef.current)
  }, [phase, seconds])

  function setup(nextLevel) {
    setLevel(nextLevel); setDeck(makeDeck(nextLevel)); setOpened([]); setMatched([]); setSeconds(timeFor(nextLevel)); setMoves(0); setCombo(0); setLocked(false); setPhase('playing')
  }
  function flip(card) {
    if (phase !== 'playing' || locked || opened.includes(card.id) || matched.includes(card.id)) return
    const next = [...opened, card.id]
    setOpened(next)
    if (next.length < 2) return
    setMoves(value => value + 1)
    const [first, second] = next.map(id => deck.find(item => item.id === id))
    if (first.face === second.face) {
      const chain = combo + 1
      const multiplier = chain >= 6 ? 4 : chain >= 3 ? 2 : 1
      setCombo(chain); setBestCombo(value => Math.max(value, chain)); setScore(value => value + (120 + level * 25) * multiplier); setMatched(value => [...value, first.id, second.id]); setOpened([]); playSfx(chain >= 3 ? 'combo' : 'correct')
      if (matched.length + 2 === deck.length) { setPhase('cleared'); playSfx('levelComplete') }
      return
    }
    setErrors(value => value + 1); setCombo(0); setScore(value => Math.max(0, value - 35)); setLocked(true); playSfx('wrong')
    window.setTimeout(() => { setOpened([]); setLocked(false) }, 650)
  }
  function replay() { setScore(0); setErrors(0); setBestCombo(0); setComplete(false); setup(1) }
  const multiplier = combo >= 6 ? 4 : combo >= 3 ? 2 : 1
  const result = <div className="memory-result-stats"><span>Skor <strong>{score}</strong></span><span>En iyi combo <strong>x{bestCombo >= 6 ? 4 : bestCombo >= 3 ? 2 : 1}</strong></span><span>Hata <strong>{errors}</strong></span><span>Level <strong>{level}/{TOTAL_LEVELS}</strong></span></div>
  return <GameShell title="Memory" category="Hafıza" score={score} accuracy={moves ? pairs / moves * 100 : null} currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${seconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase === 'cleared' || phase === 'failed' ? <section className={`level-success ${phase === 'failed' ? 'game-failure' : ''}`}><h2>{phase === 'cleared' ? `Level ${level} tamamlandı` : 'Süre doldu'}</h2><p>{pairs} çift · {moves} hamle · {seconds}s · combo x{multiplier}</p><button className="primary-button" type="button" onClick={phase === 'failed' ? () => setup(level) : level === TOTAL_LEVELS ? () => setComplete(true) : () => setup(level + 1)}>{phase === 'failed' ? 'Tekrar Dene' : level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level'}</button></section> : <div className="memory-game"><p className="new-game-prompt">Level {level} · Eşleşen kartları bul, comboyu koru</p><div className="memory-status"><span>{pairs} çift</span><span>Hamle <strong>{moves}</strong></span><span>COMBO x{multiplier}</span></div><div className="memory-board" style={{ gridTemplateColumns: `repeat(${columnsFor(pairs)}, minmax(0, 1fr))` }}>{deck.map(card => { const revealed = opened.includes(card.id) || matched.includes(card.id); return <button className={`memory-card${revealed ? ' revealed' : ''}${matched.includes(card.id) ? ' matched' : ''}`} type="button" key={card.id} onClick={() => flip(card)}><span>{revealed ? card.face : '?'}</span></button> })}</div><GameFeedback type="neutral" combo={combo >= 3 ? multiplier : null}>Doğru eşleşmeler puan çarpanını büyütür.</GameFeedback></div>}
  </GameShell>
}
export default MemoryGame
