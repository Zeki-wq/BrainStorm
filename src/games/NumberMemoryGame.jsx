import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 8

function makeNumber(length) {
  return `${Math.floor(Math.random() * 9) + 1}${Array.from({ length: length - 1 }, () => Math.floor(Math.random() * 10)).join('')}`
}

function NumberMemoryGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [number, setNumber] = useState(() => makeNumber(4))
  const [phase, setPhase] = useState('showing')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (phase !== 'showing' || complete) return undefined
    const timer = window.setTimeout(() => setPhase('input'), 1700)
    return () => window.clearTimeout(timer)
  }, [phase, round, complete])

  useEffect(() => {
    if (phase !== 'feedback') return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1)
        setPhase('done')
        return
      }
      const nextRound = round + 1
      setRound(nextRound)
      setNumber(makeNumber(nextRound + 3))
      setAnswer('')
      setFeedback(null)
      setPhase('showing')
    }, 650)
    return () => window.clearTimeout(timer)
  }, [phase, round])

  function submit(event) {
    event.preventDefault()
    if (phase !== 'input' || answer === '') return
    const isCorrect = answer === number
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setPhase('feedback')
    if (isCorrect) {
      setCorrect(value => value + 1)
      setScore(value => value + number.length * 100)
    } else {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 50))
    }
  }

  function replay() {
    setRound(1); setNumber(makeNumber(4)); setPhase('showing'); setAnswer(''); setFeedback(null)
    setCorrect(0); setErrors(0); setScore(0)
  }

  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Ulaşılan digit sayısı<strong>{Math.min(round, TOTAL_ROUNDS) + 3}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span></div>

  return <GameShell title="Number Memory" category="Hafıza" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="number-memory-game">
      <p className="new-game-prompt">Sayıyı aklında tut</p>
      <div className={`sequence-display ${phase === 'showing' ? 'visible' : ''}`} aria-live="polite">{phase === 'showing' ? number : phase === 'feedback' && feedback === 'correct' ? 'Doğru!' : phase === 'feedback' ? 'Tekrar dene!' : '•••••••••••'}</div>
      {phase === 'input' && <form className="memory-number-form" onSubmit={submit}>
        <label className="math-answer-label" htmlFor="memory-number-input">Hatırladığın sayı</label>
        <input id="memory-number-input" className="math-answer-input" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={answer} onChange={event => setAnswer(event.target.value)} autoFocus />
        <button className="primary-button math-submit" type="submit" disabled={answer.length === 0}>Kontrol et</button>
      </form>}
      <p className="new-game-hint">{round + 3} haneli sayı</p>
    </div>
  </GameShell>
}

export default NumberMemoryGame
