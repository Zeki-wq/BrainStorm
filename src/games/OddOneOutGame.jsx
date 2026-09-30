import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 10
const SYMBOL_PAIRS = [
  ['●', '◉'], ['◆', '◇'], ['■', '▣'], ['▲', '△'], ['★', '☆'],
  ['♥', '♡'], ['✚', '✜'], ['⬟', '⬢'], ['☀', '☼'], ['✿', '❀'],
]

function makeRound(round) {
  const gridSize = round >= 8 ? 4 : 3
  const count = gridSize * gridSize
  const position = Math.floor(Math.random() * count)
  const pairPool = round <= 3 ? SYMBOL_PAIRS.slice(1, 8) : round <= 6 ? SYMBOL_PAIRS : SYMBOL_PAIRS.slice(0, 5)
  const [common, different] = pairPool[Math.floor(Math.random() * pairPool.length)]
  return {
    gridSize,
    position,
    cells: Array.from({ length: count }, (_, index) => index === position ? different : common),
  }
}

function OddOneOutGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [board, setBoard] = useState(() => makeRound(1))
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [roundStartedAt, setRoundStartedAt] = useState(() => performance.now())
  const [elapsed, setElapsed] = useState(0)
  const [answerTimes, setAnswerTimes] = useState([])
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (complete) return undefined
    const timer = window.setInterval(() => setElapsed(performance.now() - roundStartedAt), 100)
    return () => window.clearInterval(timer)
  }, [complete, roundStartedAt])

  function choose(index, event) {
    if (complete) return
    if (index !== board.position) {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 50))
      return
    }

    const answerTime = Math.round(event.timeStamp - roundStartedAt)
    setCorrect(value => value + 1)
    setAnswerTimes(value => [...value, answerTime])
    setScore(value => value + Math.max(10, Math.round(500 - answerTime / 10)))
    if (round === TOTAL_ROUNDS) {
      setRound(TOTAL_ROUNDS + 1)
      return
    }
    const nextRound = round + 1
    setRound(nextRound)
    setBoard(makeRound(nextRound))
    setRoundStartedAt(event.timeStamp)
    setElapsed(0)
  }

  function replay() {
    setRound(1)
    setBoard(makeRound(1))
    setCorrect(0)
    setErrors(0)
    setScore(0)
    setAnswerTimes([])
    setRoundStartedAt(performance.now())
    setElapsed(0)
  }

  const average = answerTimes.length
    ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn`
    : '—'
  const result = <div className="odd-result-stats"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama cevap süresi<strong>{average}</strong></span></div>

  return <GameShell title="Odd One Out" category="Dikkat" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="odd-game">
      <p className="odd-prompt">Diğerlerinden farklı olan sembolü bul</p>
      <div className="odd-grid" style={{ '--grid-size': board.gridSize }} aria-label={`${board.gridSize} x ${board.gridSize} sembol tablosu`}>
        {board.cells.map((symbol, index) => <button className="odd-cell" type="button" key={`${round}-${index}`} onClick={event => choose(index, event)} aria-label={`Sembol ${index + 1}`}>
          {symbol}
        </button>)}
      </div>
      <p className="odd-timer">Cevap süresi: {(elapsed / 1000).toFixed(1)} sn</p>
      <div className="odd-scoreline"><span>Doğru <strong>{correct}</strong></span><span>Hata <strong>{errors}</strong></span></div>
    </div>
  </GameShell>
}

export default OddOneOutGame
