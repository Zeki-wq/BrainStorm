import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 12
const COLORS = [{ name: 'KIRMIZI', value: '#ef737e' }, { name: 'MAVİ', value: '#73a8f4' }, { name: 'SARI', value: '#f0cc67' }, { name: 'YEŞİL', value: '#70d2a0' }]

function makeTrial(rule) {
  return {
    rule,
    number: Math.floor(Math.random() * 9) + 1,
    shape: Math.random() < 0.5 ? '○' : '■',
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

function ruleFor(round, previous) {
  if (round <= 3) return 'number'
  if (round <= 5) return 'shape'
  if (round <= 7) return 'color'
  if (round === 8) return 'number+shape'
  const cycle = ['number', 'shape', 'color', 'number+shape']
  const current = cycle.indexOf(previous)
  return cycle[(current + (round >= 10 ? 2 : 1)) % cycle.length]
}

function TaskSwitchGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [rule, setRule] = useState(() => ruleFor(1, 'number'))
  const [trial, setTrial] = useState(() => makeTrial(rule))
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
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1)
        setFeedback(null)
        return
      }
      const nextRound = round + 1
      const nextRule = ruleFor(nextRound, rule)
      setRule(nextRule)
      setTrial(makeTrial(nextRule))
      setRound(nextRound)
      setStartedAt(performance.now())
      setFeedback(null)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [feedback, round, rule])

  function answer(side, event) {
    if (feedback || complete) return
    const expected = rule === 'number'
      ? (trial.number % 2 ? 'left' : 'right')
      : rule === 'shape'
        ? (trial.shape === '○' ? 'left' : 'right')
        : rule === 'color'
          ? (trial.color.name === 'KIRMIZI' || trial.color.name === 'SARI' ? 'left' : 'right')
          : (trial.number % 2 === 0 && trial.shape === '○' ? 'left' : 'right')
    const isCorrect = side === expected
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    setAnswerTimes(times => [...times, elapsed])
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      setCorrect(value => value + 1)
      setScore(value => value + 100 + Math.max(0, Math.round(250 - elapsed / 20)))
    } else {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 30))
    }
  }

  function replay() {
    const initialRule = ruleFor(1, 'number')
    setRound(1); setRule(initialRule); setTrial(makeTrial(initialRule)); setStartedAt(performance.now())
    setFeedback(null); setCorrect(0); setErrors(0); setScore(0); setAnswerTimes([])
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span></div>

  return <GameShell title="Task Switch" category="Dikkat" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="task-switch-game">
      <div className="active-rule"><span>AKTİF KURAL · TUR {round}</span><strong>{rule === 'number' ? 'SAYI' : rule === 'shape' ? 'ŞEKİL' : rule === 'color' ? 'RENK' : 'SAYI + ŞEKİL'}</strong><small>{rule === 'number' ? 'Tek: sol · Çift: sağ' : rule === 'shape' ? 'Daire: sol · Kare: sağ' : rule === 'color' ? 'Kırmızı/sarı: sol · Mavi/yeşil: sağ' : 'Çift ve daire: sol · diğerleri: sağ'}</small></div>
      <div className="task-stimulus"><span>{trial.number}</span><strong style={{ color: trial.color.value }}>{trial.shape}</strong></div>
      <div className="task-switch-actions"><button type="button" className="task-side-button" onClick={event => answer('left', event)} disabled={feedback !== null}>SOL</button><button type="button" className="task-side-button" onClick={event => answer('right', event)} disabled={feedback !== null}>SAĞ</button></div>
      <p className={`game-feedback ${feedback ?? ''}`} aria-live="polite">{feedback === 'correct' ? 'Doğru kural!' : feedback === 'wrong' ? 'Kuralı tekrar kontrol et.' : ' '}</p>
    </div>
  </GameShell>
}

export default TaskSwitchGame
