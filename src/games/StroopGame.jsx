import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_ROUNDS = 10
const timeFor = round => Math.max(5, 10 - Math.floor((round - 1) / 3))
const COLORS = [
  { name: 'KIRMIZI', value: '#f0717e' }, { name: 'MAVİ', value: '#72a7f4' },
  { name: 'YEŞİL', value: '#71d2a0' }, { name: 'SARI', value: '#f0cd69' },
]

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function makeTrial(round) {
  const wordIndex = Math.floor(Math.random() * COLORS.length)
  const canMatch = round >= 5 ? 0.35 + (round - 5) * 0.1 : 0.08
  const inkIndex = Math.random() < canMatch
    ? wordIndex
    : (wordIndex + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length
  const mode = round >= 5 && Math.random() < 0.5 ? 'initial' : 'ink'
  return { word: COLORS[wordIndex].name, ink: COLORS[inkIndex], target: COLORS[wordIndex], mode, options: shuffle(COLORS) }
}

function StroopGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [trial, setTrial] = useState(() => makeTrial(1))
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [answerTimes, setAnswerTimes] = useState([])
  const [timeLeft, setTimeLeft] = useState(timeFor(1))
  const [points, setPoints] = useState(null)
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (feedback || complete) return undefined
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) { setErrors(value => value + 1); setScore(value => Math.max(0, value - 30)); setPoints(-30); setFeedback('timeout') }
      else setTimeLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [feedback, complete, timeLeft, round])

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1)
        setFeedback(null)
        return
      }
      const nextRound = round + 1
      setRound(nextRound)
      setTrial(makeTrial(nextRound))
      setStartedAt(performance.now())
      setTimeLeft(timeFor(nextRound))
      setPoints(null)
      setFeedback(null)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function choose(color, event) {
    if (feedback || complete) return
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    const target = trial.mode === 'ink' ? trial.ink : trial.target
    const isCorrect = color.name === target.name
    setAnswerTimes(times => [...times, elapsed])
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      setCorrect(value => value + 1)
      const gained = 100 + Math.max(0, Math.round(250 - elapsed / 20)); setScore(value => value + gained); setPoints(gained)
    } else {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 30)); setPoints(-30)
    }
  }

  function replay() {
    setRound(1); setTrial(makeTrial(1)); setCorrect(0); setErrors(0); setScore(0)
    setFeedback(null); setStartedAt(performance.now()); setAnswerTimes([]); setTimeLeft(timeFor(1)); setPoints(null)
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span></div>

  return <GameShell title="Stroop Challenge" category="Dikkat" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} timeRemaining={`${timeLeft}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className={`stroop-game ${feedback === 'wrong' || feedback === 'timeout' ? 'screen-shake' : ''}`}>
      <p className="new-game-prompt">{trial.mode === 'ink' ? 'Kelimeyi değil, yazı rengini seç.' : 'Kelimenin ilk harfine uyan rengi seç.'} · {timeLeft}s</p>
      <div className="stroop-word" style={{ color: trial.ink.value }}>{trial.word}</div>
      <div className="color-options">{trial.options.map(color => <button className="color-option" type="button" key={color.name} onClick={event => choose(color, event)} disabled={feedback !== null} style={{ '--option-color': color.value }}>{color.name}</button>)}</div>
      <GameFeedback type={feedback === 'correct' ? 'correct' : feedback ? 'wrong' : 'neutral'} points={points}>{feedback === 'correct' ? 'Kuralı doğru uyguladın!' : feedback === 'wrong' ? `Yanlış · doğru cevap ${trial.mode === 'ink' ? trial.ink.name : trial.target.name}.` : feedback === 'timeout' ? 'Süre doldu.' : 'Kuralı oku, sonra rengi seç.'}</GameFeedback>
    </div>
  </GameShell>
}

export default StroopGame
