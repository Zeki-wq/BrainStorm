import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 12
const SYMBOLS = ['●', '▲', '■', '◆', '★', '☾']

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function optionsFor(answer, decoys) {
  return shuffle([...new Set([String(answer), ...decoys.map(String)].filter(value => value !== ''))].slice(0, 4))
}

function makeNumericQuestion(values, answer, nearby = [answer - 1, answer + 1, answer + 3]) {
  return { values: values.map(String), answer: String(answer), options: optionsFor(answer, nearby) }
}

function makeQuestion(round) {
  if (round <= 3) {
    const type = Math.floor(Math.random() * 3)
    if (type === 0) {
      const start = Math.floor(Math.random() * 8) + 1
      const step = Math.floor(Math.random() * 2) + 1
      const values = Array.from({ length: 5 }, (_, index) => start + step * index)
      return makeNumericQuestion(values, start + step * 5, [start + step * 4, start + step * 6, start + step * 5 + 2])
    }
    const symbolStart = Math.floor(Math.random() * (SYMBOLS.length - 1))
    const validBase = type === 1 ? ['A', 'B'] : [SYMBOLS[symbolStart], SYMBOLS[symbolStart + 1]]
    const values = Array.from({ length: 6 }, (_, index) => validBase[index % 2])
    const answer = validBase[0]
    return { values, answer, options: optionsFor(answer, [...new Set([...validBase, 'C', 'D', '■'])]) }
  }

  if (round <= 6) {
    const type = Math.floor(Math.random() * 4)
    const start = Math.floor(Math.random() * 5) + 2
    if (type === 0) {
      const values = [start, start + 3, start + 7, start + 12]
      return makeNumericQuestion(values, start + 18, [start + 17, start + 19, start + 23])
    }
    if (type === 1) {
      const values = [start + 18, start + 15, start + 11, start + 6]
      return makeNumericQuestion(values, start, [start - 1, start + 1, start - 4])
    }
    if (type === 2) {
      const values = Array.from({ length: 4 }, (_, index) => start * (2 ** index))
      const answer = values[3] * 2
      return makeNumericQuestion(values, answer, [answer - 2, answer + 2, answer / 2])
    }
    const values = [start, start + 4, start + 8, start + 7, start + 11]
    return makeNumericQuestion(values, start + 15, [start + 14, start + 16, start + 19])
  }

  if (round <= 9) {
    const type = Math.floor(Math.random() * 3)
    const start = Math.floor(Math.random() * 4) + 2
    if (type === 0) {
      const values = [start]
      for (let index = 0; index < 4; index += 1) values.push(values.at(-1) * 2 + 1)
      const answer = values.at(-1) * 2 + 1
      return makeNumericQuestion(values, answer, [answer - 1, answer + 1, values.at(-1) * 2])
    }
    if (type === 1) {
      const values = [start, start * 2, start * 2 + 2, start * 4 + 4, start * 4 + 6]
      return makeNumericQuestion(values, start * 8 + 12, [start * 8 + 10, start * 8 + 14, start * 4 + 8])
    }
    const steps = [1, 3, 2, 4, 3]
    const values = [start]
    steps.slice(0, 4).forEach(step => values.push(values.at(-1) + step))
    return makeNumericQuestion(values, values.at(-1) + steps[4], [values.at(-1) + 2, values.at(-1) + 4, values.at(-1) + 5])
  }

  const visualType = Math.floor(Math.random() * 3)
  if (visualType === 1) {
    const directions = ['↑', '→', '↓', '←']
    const offset = Math.floor(Math.random() * directions.length)
    const values = Array.from({ length: 5 }, (_, index) => directions[(offset + index) % directions.length])
    const answer = directions[(offset + 5) % directions.length]
    return { values, answer, options: optionsFor(answer, directions.filter(item => item !== answer)) }
  }
  if (visualType === 2) {
    const colors = ['KIRMIZI', 'MAVİ', 'YEŞİL', 'SARI', 'MOR']
    const offset = Math.floor(Math.random() * colors.length)
    const values = Array.from({ length: 5 }, (_, index) => colors[(offset + index * 2) % colors.length])
    const answer = colors[(offset + 5 * 2) % colors.length]
    return { values, answer, options: optionsFor(answer, colors.filter(item => item !== answer)) }
  }
  const matrixBase = Math.floor(Math.random() * SYMBOLS.length)
  const values = Array.from({ length: 8 }, (_, index) => SYMBOLS[(matrixBase + Math.floor(index / 3) + index % 3) % SYMBOLS.length])
  const answer = SYMBOLS[(matrixBase + 4) % SYMBOLS.length]
  return { matrix: [...values.slice(0, 6), values[6], values[7], '?'], answer, options: optionsFor(answer, [SYMBOLS[(matrixBase + 3) % SYMBOLS.length], SYMBOLS[(matrixBase + 5) % SYMBOLS.length], SYMBOLS[(matrixBase + 2) % SYMBOLS.length]]) }
}

function PatternLogicGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [question, setQuestion] = useState(() => makeQuestion(1))
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [answerTimes, setAnswerTimes] = useState([])
  const complete = round > TOTAL_ROUNDS
  const level = round <= 3 ? 1 : round <= 6 ? 2 : round <= 9 ? 3 : 4

  useEffect(() => {
    if (feedback === null) return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1)
        setFeedback(null)
        return
      }
      const nextRound = round + 1
      setRound(nextRound)
      setQuestion(makeQuestion(nextRound))
      setStartedAt(performance.now())
      setFeedback(null)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function choose(option, event) {
    if (feedback !== null || complete) return
    const isCorrect = option === question.answer
    const responseTime = Math.max(0, Math.round(event.timeStamp - startedAt))
    setAnswerTimes(times => [...times, responseTime])
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      setCorrect(value => value + 1)
      setScore(value => value + 100 + Math.max(0, Math.round(300 - responseTime / 20)))
    } else {
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - 35))
    }
  }

  function replay() {
    setRound(1)
    setQuestion(makeQuestion(1))
    setCorrect(0)
    setErrors(0)
    setScore(0)
    setFeedback(null)
    setStartedAt(performance.now())
    setAnswerTimes([])
  }

  const accuracy = correct + errors ? Math.round((correct / (correct + errors)) * 100) : 0
  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Doğruluk<strong>%{accuracy}</strong></span><span>Ortalama cevap<strong>{average}</strong></span></div>

  return <GameShell title="Pattern Logic" category="Mantık" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="pattern-logic-game">
      <p className="new-game-prompt">Seviye {level} · {['Kolay', 'Orta', 'Zor', 'Çok zor'][level - 1]}</p>
      {question.matrix
        ? <div className="pattern-matrix">{question.matrix.map((value, index) => <span className={value === '?' ? 'matrix-missing' : ''} key={`${round}-${index}`}>{value}</span>)}</div>
        : <div className="pattern-sequence" aria-label="Örüntü">{question.values.join('  ')} <strong>?</strong></div>}
      <div className="pattern-options">{question.options.map((option, index) => <button className={`pattern-option${feedback === null ? '' : option === question.answer ? ' answer-correct' : feedback === 'wrong' ? ' answer-wrong' : ''}`} type="button" key={`${round}-${option}`} onClick={event => choose(option, event)} disabled={feedback !== null} aria-label={`Seçenek ${index + 1}: ${option}`}>{option}</button>)}</div>
      <p className={`game-feedback ${feedback ?? ''}`} aria-live="polite">{feedback === 'correct' ? 'Doğru!' : feedback === 'wrong' ? 'Bir sonraki örüntüye geçiyoruz.' : ' '}</p>
    </div>
  </GameShell>
}

export default PatternLogicGame
