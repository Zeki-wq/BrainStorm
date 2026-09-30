import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 10
const SIMILAR_PAIRS = [['O', '0'], ['▲', '△'], ['□', '▫'], ['C', 'G'], ['●', '◉']]
const SIMPLE_PAIRS = [['●', '▲'], ['★', '◆'], ['A', 'B'], ['■', '○']]

function makeTrial(round) {
  const similar = round >= 5 ? Math.random() < (round - 3) / 8 : false
  const pool = similar ? SIMILAR_PAIRS : SIMPLE_PAIRS
  const pair = pool[Math.floor(Math.random() * pool.length)]
  const same = Math.random() < 0.5
  if (same) return { symbols: [pair[0], pair[0]], answer: 'same' }
  const symbols = Math.random() < 0.5 ? pair : [...pair].reverse()
  return { symbols, answer: 'different' }
}

function SpeedMatchGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [trial, setTrial] = useState(() => makeTrial(1))
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [feedback, setFeedback] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [answerTimes, setAnswerTimes] = useState([])
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) { setRound(TOTAL_ROUNDS + 1); setFeedback(null); return }
      const next = round + 1
      setRound(next); setTrial(makeTrial(next)); setStartedAt(performance.now()); setFeedback(null)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function choose(choice, event) {
    if (feedback || complete) return
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    const isCorrect = choice === trial.answer
    setAnswerTimes(times => [...times, elapsed]); setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) { setCorrect(value => value + 1); setScore(value => value + 100 + Math.max(0, Math.round(250 - elapsed / 20))) }
    else { setErrors(value => value + 1); setScore(value => Math.max(0, value - 30)) }
  }

  function replay() {
    setRound(1); setTrial(makeTrial(1)); setStartedAt(performance.now()); setFeedback(null)
    setCorrect(0); setErrors(0); setScore(0); setAnswerTimes([])
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span></div>

  return <GameShell title="Speed Match" category="Hız" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="speed-match-game">
      <p className="new-game-prompt">İki sembol aynı mı, farklı mı?</p>
      <div className="speed-match-pair"><span>{trial.symbols[0]}</span><span>{trial.symbols[1]}</span></div>
      <div className="speed-match-actions"><button type="button" onClick={event => choose('same', event)} disabled={feedback !== null}>AYNI</button><button type="button" onClick={event => choose('different', event)} disabled={feedback !== null}>FARKLI</button></div>
      <p className={`game-feedback ${feedback ?? ''}`} aria-live="polite">{feedback === 'correct' ? 'Doğru!' : feedback === 'wrong' ? 'Yanlış seçim.' : ' '}</p>
    </div>
  </GameShell>
}

export default SpeedMatchGame
