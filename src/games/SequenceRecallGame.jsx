import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 8

function makeRound(round) {
  const size = round <= 2 ? 3 : round <= 4 ? 4 : round <= 6 ? 5 : 6
  const length = round + 2
  const sequence = []
  while (sequence.length < length) {
    const next = Math.floor(Math.random() * (size * size))
    if (sequence.at(-1) !== next) sequence.push(next)
  }
  return { size, sequence }
}

function SequenceRecallGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [board, setBoard] = useState(() => makeRound(1))
  const [phase, setPhase] = useState('playback')
  const [playIndex, setPlayIndex] = useState(0)
  const [flash, setFlash] = useState(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [longest, setLongest] = useState(0)
  const [feedback, setFeedback] = useState('')
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (phase !== 'playback') return undefined
    const timer = window.setTimeout(() => {
      if (playIndex >= board.sequence.length) {
        setFlash(null)
        setPhase('input')
      } else {
        setFlash(board.sequence[playIndex])
        setPlayIndex(index => index + 1)
      }
    }, playIndex === 0 ? 350 : Math.max(260, 560 - round * 32))
    return () => window.clearTimeout(timer)
  }, [phase, playIndex, board.sequence, round])

  useEffect(() => {
    if (phase !== 'feedback') return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) {
        setRound(TOTAL_ROUNDS + 1); setPhase('done'); setFeedback('')
        return
      }
      const next = round + 1
      setRound(next); setBoard(makeRound(next)); setPlayIndex(0); setInputIndex(0); setFlash(null); setPhase('playback'); setFeedback('')
    }, 600)
    return () => window.clearTimeout(timer)
  }, [phase, round])

  function choose(index) {
    if (phase !== 'input') return
    if (index !== board.sequence[inputIndex]) {
      setErrors(value => value + 1); setScore(value => Math.max(0, value - 30)); setFeedback('Sıra karıştı.')
      setPhase('feedback')
      return
    }
    const nextIndex = inputIndex + 1
    setInputIndex(nextIndex)
    if (nextIndex === board.sequence.length) {
      setCorrect(value => value + 1); setScore(value => value + board.sequence.length * 60)
      setLongest(value => Math.max(value, board.sequence.length)); setFeedback('Sıralama doğru!'); setPhase('feedback')
    }
  }

  function replay() {
    setRound(1); setBoard(makeRound(1)); setPhase('playback'); setPlayIndex(0); setInputIndex(0); setFlash(null)
    setCorrect(0); setErrors(0); setScore(0); setLongest(0); setFeedback('')
  }

  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Tamamlanan tur<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>En uzun doğru dizi<strong>{longest}</strong></span></div>

  return <GameShell title="Sequence Recall" category="Hafıza" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="sequence-recall-game">
      <p className="new-game-prompt">{phase === 'playback' ? `Sırayı izle · ${playIndex}/${board.sequence.length}` : phase === 'input' ? `Aynı sırayla seç · ${inputIndex}/${board.sequence.length}` : feedback}</p>
      <div className="sequence-recall-grid" style={{ '--grid-size': board.size }}>
        {Array.from({ length: board.size ** 2 }, (_, index) => <button className={`sequence-recall-cell${flash === index ? ' lit' : ''}`} key={`${round}-${index}`} type="button" onClick={() => choose(index)} disabled={phase !== 'input'} aria-label={`Hücre ${index + 1}`}>{flash === index ? playIndex : ''}</button>)}
      </div>
      <p className="new-game-hint">Dizi uzunluğu: {board.sequence.length}</p>
    </div>
  </GameShell>
}

export default SequenceRecallGame
