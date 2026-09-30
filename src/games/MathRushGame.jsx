import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_QUESTIONS = 10
const timeFor = round => Math.max(5, 12 - Math.floor((round - 1) / 2))
function makeQuestion(round) {
  if (round >= 7 && Math.random() < 0.35) { const divisor = Math.floor(Math.random() * 9) + 2; const answer = Math.floor(Math.random() * 10) + 2; return { text: `${divisor * answer} ÷ ${divisor}`, answer } }
  if (round >= 5 && Math.random() < 0.5) { const left = Math.floor(Math.random() * 12) + 2; const right = Math.floor(Math.random() * 9) + 2; return { text: `${left} × ${right}`, answer: left * right } }
  const left = Math.floor(Math.random() * (round * 4 + 24)) + 10
  const right = Math.floor(Math.random() * (round * 2 + 12)) + 1
  if (Math.random() < 0.5) return { text: `${left} + ${right}`, answer: left + right }
  return { text: `${Math.max(left, right)} − ${Math.min(left, right)}`, answer: Math.abs(left - right) }
}

function MathRushGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [question, setQuestion] = useState(() => makeQuestion(1))
  const [answer, setAnswer] = useState('')
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [answerTimes, setAnswerTimes] = useState([])
  const [timeLeft, setTimeLeft] = useState(timeFor(1))
  const [feedback, setFeedback] = useState(null)
  const [points, setPoints] = useState(null)
  const complete = round > TOTAL_QUESTIONS

  useEffect(() => {
    if (complete || feedback) return undefined
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setFeedback('timeout'); setErrors(value => value + 1); setStreak(0); setScore(value => Math.max(0, value - 50)); setPoints(-50); setAnswer('')
      } else setTimeLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [complete, feedback, timeLeft, round])
  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_QUESTIONS) { setRound(TOTAL_QUESTIONS + 1); setFeedback(null); return }
      const next = round + 1
      setRound(next); setQuestion(makeQuestion(next)); setAnswer(''); setTimeLeft(timeFor(next)); setStartedAt(performance.now()); setFeedback(null); setPoints(null)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function submit(value = answer) {
    if (complete || feedback || value === '') return
    const elapsed = Math.round(performance.now() - startedAt)
    setAnswerTimes(times => [...times, elapsed])
    if (Number(value) === question.answer) {
      const combo = streak + 1
      const multiplier = combo >= 10 ? 4 : combo >= 5 ? 3 : combo >= 3 ? 2 : 1
      const gained = Math.max(80, Math.round(230 - elapsed / 18)) * multiplier
      setCorrect(count => count + 1); setStreak(combo); setBestStreak(best => Math.max(best, combo)); setScore(points => points + gained); setPoints(gained); setFeedback('correct')
    } else {
      setErrors(count => count + 1); setStreak(0); setScore(points => Math.max(0, points - 50)); setPoints(-50); setFeedback('wrong')
    }
  }
  function replay() { setRound(1); setQuestion(makeQuestion(1)); setAnswer(''); setCorrect(0); setErrors(0); setScore(0); setStreak(0); setBestStreak(0); setAnswerTimes([]); setTimeLeft(timeFor(1)); setPoints(null); setFeedback(null); setStartedAt(performance.now()) }
  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama süre<strong>{average}</strong></span><span>En uzun combo<strong>{bestStreak}</strong></span></div>
  return <GameShell title="Math Rush" category="Mantık" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_QUESTIONS : round - 1} totalRounds={TOTAL_QUESTIONS} timeRemaining={`${timeLeft}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <form className={`math-rush-game ${feedback === 'wrong' || feedback === 'timeout' ? 'screen-shake' : ''}`} onSubmit={event => { event.preventDefault(); submit() }}>
      <p className="new-game-prompt">Soru {round}/{TOTAL_QUESTIONS} · Çöz ve süre dolmadan gir</p>
      <div className="math-rush-streak">COMBO {streak} · ×{streak >= 10 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1}<span>{timeLeft}s</span></div>
      <div className={`math-question${timeLeft <= 3 ? ' timer-critical' : ''}`}>{question.text} = ?</div>
      <label className="math-answer-label" htmlFor="math-answer">Cevabın</label><input id="math-answer" className="math-answer-input" type="number" inputMode="numeric" value={answer} onChange={event => setAnswer(event.target.value)} autoFocus disabled={Boolean(feedback)} />
      <button className="primary-button math-submit" type="submit" disabled={answer === '' || Boolean(feedback)}>Cevapla</button>
      <GameFeedback type={feedback === 'correct' ? 'correct' : feedback ? 'wrong' : 'neutral'} points={points} combo={feedback === 'correct' && streak >= 3 ? (streak >= 10 ? 4 : streak >= 5 ? 3 : 2) : null}>{feedback === 'correct' ? 'İşlem doğru!' : feedback === 'timeout' ? `Süre doldu · cevap ${question.answer}` : feedback === 'wrong' ? `Yanlış · cevap ${question.answer}` : 'Hızlı cevap daha çok puan kazandırır.'}</GameFeedback>
    </form>
  </GameShell>
}

export default MathRushGame
