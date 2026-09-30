import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_ROUNDS = 12
const timeFor = round => Math.max(5, 13 - Math.floor((round - 1) / 3))
const SHAPES = [
  { id: 'circle', label: 'DAİRE', glyph: '●' },
  { id: 'triangle', label: 'ÜÇGEN', glyph: '▲' },
  { id: 'square', label: 'KARE', glyph: '■' },
  { id: 'diamond', label: 'EŞKENAR DÖRTGEN', glyph: '◆' },
]
const COLORS = [
  { id: 'red', label: 'KIRMIZI', value: '#ef737e' },
  { id: 'blue', label: 'MAVİ', value: '#73a8f4' },
  { id: 'green', label: 'YEŞİL', value: '#70d2a0' },
  { id: 'yellow', label: 'SARI', value: '#f0cc67' },
]

function makeBoard(round, previousPosition = -1) {
  const size = round <= 3 ? 3 : round <= 6 ? 4 : round <= 9 ? 5 : 6
  const count = size * size
  const target = {
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: round >= 7 && Math.random() < 0.5 ? 'large' : 'small',
  }
  let targetIndex = Math.floor(Math.random() * count)
  if (count > 1 && targetIndex === previousPosition) targetIndex = (targetIndex + 1 + Math.floor(Math.random() * (count - 1))) % count
  const cells = Array.from({ length: count }, (_, index) => {
    if (index === targetIndex) return target
    if (round <= 3) {
      const otherShapes = SHAPES.filter(shape => shape.id !== target.shape.id)
      return { shape: otherShapes[Math.floor(Math.random() * otherShapes.length)], color: target.color, size: target.size }
    }
    if (round <= 6) {
      const otherColors = COLORS.filter(color => color.id !== target.color.id)
      return { shape: target.shape, color: otherColors[Math.floor(Math.random() * otherColors.length)], size: target.size }
    }
    const keepShape = Math.random() < (round >= 10 ? 0.72 : 0.58)
    let keepColor = Math.random() < 0.58
    if (keepShape && keepColor) keepColor = false
    const shapeOptions = keepShape ? [target.shape] : SHAPES.filter(shape => shape.id !== target.shape.id)
    const colorOptions = keepColor ? [target.color] : COLORS.filter(color => color.id !== target.color.id)
    return {
      shape: shapeOptions[Math.floor(Math.random() * shapeOptions.length)],
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      size: Math.random() < 0.55 ? target.size : target.size === 'small' ? 'large' : 'small',
    }
  })
  return { size, target, targetIndex, cells }
}

function VisualSearchGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [board, setBoard] = useState(() => makeBoard(1))
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [feedback, setFeedback] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [answerTimes, setAnswerTimes] = useState([])
  const [timeLeft, setTimeLeft] = useState(timeFor(1))
  const [points, setPoints] = useState(null)
  const complete = round > TOTAL_ROUNDS
  const level = Math.ceil(round / 3)

  useEffect(() => {
    if (feedback || complete) return undefined
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) { setErrors(value => value + 1); setScore(value => Math.max(0, value - 35)); setPoints(-35); setFeedback('timeout') }
      else setTimeLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [feedback, complete, timeLeft, round])

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      if (feedback === 'wrong' || feedback === 'timeout') {
        setFeedback(null)
        setStartedAt(performance.now())
        setTimeLeft(value => Math.max(3, value - 1))
        setPoints(null)
        return
      }
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1)
        setFeedback(null)
        return
      }
      const next = round + 1
      setRound(next)
      setBoard(makeBoard(next))
      setStartedAt(performance.now())
      setTimeLeft(timeFor(next))
      setFeedback(null)
      setPoints(null)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [feedback, round, board.targetIndex])

  function choose(index, event) {
    if (feedback || complete) return
    if (index !== board.targetIndex) {
      const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
      setAnswerTimes(times => [...times, elapsed])
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 35))
      setPoints(-35)
      setFeedback('wrong')
      return
    }
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    setAnswerTimes(times => [...times, elapsed])
    setCorrect(value => value + 1)
    const gained = Math.max(25, Math.round(550 - elapsed / 9))
    setScore(value => value + gained); setPoints(gained)
    setFeedback('correct')
  }

  function replay() {
    setRound(1); setBoard(makeBoard(1)); setStartedAt(performance.now()); setFeedback(null); setTimeLeft(timeFor(1)); setPoints(null)
    setCorrect(0); setErrors(0); setScore(0); setAnswerTimes([])
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span></div>

  return <GameShell title="Visual Search" category="Dikkat" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} timeRemaining={`${timeLeft}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className={`visual-search-game ${round >= 7 ? 'mobile-search' : ''} ${feedback === 'wrong' || feedback === 'timeout' ? 'screen-shake' : ''}`}>
      <p className="new-game-prompt">Seviye {level} · Hedefi bul · {timeLeft}s</p>
      <div className="visual-target-label"><span>HEDEF</span><strong style={{ color: board.target.color.value }}>{board.target.size === 'small' ? 'KÜÇÜK' : 'BÜYÜK'} {board.target.color.label} {board.target.shape.label}</strong></div>
      <div className="visual-search-grid" style={{ '--grid-size': board.size }} aria-label={`${board.size} x ${board.size} görsel arama tablosu`}>
        {board.cells.map((cell, index) => <button className="visual-search-cell" type="button" key={`${round}-${index}`} style={{ '--cell-order': index }} onClick={event => choose(index, event)} disabled={feedback !== null} aria-label={`${cell.size} ${cell.color.label} ${cell.shape.label}`}>
          <span className={cell.size} style={{ color: cell.color.value }}>{cell.shape.glyph}</span>
        </button>)}
      </div>
      <GameFeedback type={feedback === 'correct' ? 'correct' : feedback ? 'wrong' : 'neutral'} points={points}>{feedback === 'correct' ? 'Hedef bulundu!' : feedback === 'wrong' ? 'Yanlış hedef · bir saniye ceza.' : feedback === 'timeout' ? 'Süre doldu · aynı hedefi tekrar bul.' : 'Hedef özelliklerini taramaya başla.'}</GameFeedback>
    </div>
  </GameShell>
}

export default VisualSearchGame
