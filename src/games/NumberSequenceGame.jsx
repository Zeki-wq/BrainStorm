import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_ROUNDS = 12
const shuffle = values => { const next = [...values]; for (let i = next.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]] } return next }
const options = answer => shuffle([answer, ...shuffle([answer + 1, answer - 1, answer + 2, answer - 2]).slice(0, 3)])
function makeQuestion(round) {
  const start = 2 + Math.floor(Math.random() * 8)
  let values
  if (round <= 3) { const step = 2 + Math.floor(Math.random() * 5); values = Array.from({ length: 5 }, (_, i) => start + i * step) }
  else if (round <= 6) { const step = 2 + Math.floor(Math.random() * 4); values = Array.from({ length: 5 }, (_, i) => start + (i % 2 ? step : 0) + Math.floor(i / 2) * (step + 2)) }
  else if (round <= 9) { const factor = round % 2 ? 2 : 3; values = Array.from({ length: 5 }, (_, i) => start * (factor ** i)) }
  else { const delta = 2 + Math.floor(Math.random() * 3); values = [start, start + delta, start + delta - 1, start + delta * 2 - 1, start + delta * 2 - 2] }
  const missing = 2 + Math.floor(Math.random() * 3)
  const shown = values.map((value, index) => index === missing ? '?' : value)
  return { shown, answer: values[missing], choices: options(values[missing]) }
}
function NumberSequenceGame({ onBack }) {
  const [round, setRound] = useState(1); const [question, setQuestion] = useState(() => makeQuestion(1)); const [correct, setCorrect] = useState(0); const [errors, setErrors] = useState(0); const [score, setScore] = useState(0); const [combo, setCombo] = useState(0); const [feedback, setFeedback] = useState(null); const [seconds, setSeconds] = useState(12); const complete = round > TOTAL_ROUNDS
  useEffect(() => { if (complete || feedback) return undefined; const timer = window.setTimeout(() => { if (seconds <= 1) { setSeconds(0); setErrors(v => v + 1); setCombo(0); setFeedback('timeout'); playSfx('wrong') } else setSeconds(v => v - 1) }, 1000); return () => window.clearTimeout(timer) }, [complete, feedback, seconds])
  useEffect(() => { if (!feedback) return undefined; const timer = window.setTimeout(() => { if (round === TOTAL_ROUNDS) { setRound(TOTAL_ROUNDS + 1); return } const next = round + 1; setRound(next); setQuestion(makeQuestion(next)); setSeconds(Math.max(5, 13 - Math.floor(next / 3))); setFeedback(null) }, 600); return () => window.clearTimeout(timer) }, [feedback, round])
  function choose(value) { if (feedback || complete) return; const right = value === question.answer; setFeedback(right ? 'correct' : 'wrong'); if (right) { const chain = combo + 1; const multiplier = chain >= 6 ? 3 : chain >= 3 ? 2 : 1; setCorrect(v => v + 1); setCombo(chain); setScore(v => v + (120 + seconds * 12) * multiplier); playSfx(chain >= 3 ? 'combo' : 'correct') } else { setErrors(v => v + 1); setCombo(0); setScore(v => Math.max(0, v - 35)); playSfx('wrong') } }
  function replay() { setRound(1); setQuestion(makeQuestion(1)); setCorrect(0); setErrors(0); setScore(0); setCombo(0); setFeedback(null); setSeconds(12) }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Hata<strong>{errors}</strong></span><span>En uzun kural<strong>{Math.max(1, Math.ceil(correct / 3))}</strong></span></div>
  return <GameShell title="Number Sequence" category="Hafıza" score={score} accuracy={correct + errors ? correct / (correct + errors) * 100 : null} currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} timeRemaining={`${seconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}><div className="number-sequence-game"><p className="new-game-prompt">Eksik terimi bul · kural her seviyede zorlaşır</p><div className="pattern-sequence">{question.shown.join('  ·  ')}</div><div className="pattern-options">{question.choices.map(value => <button type="button" className="pattern-option" key={value} disabled={Boolean(feedback)} onClick={() => choose(value)}>{value}</button>)}</div><GameFeedback type={feedback === 'correct' ? 'correct' : feedback ? 'wrong' : 'neutral'} combo={combo >= 3 ? combo >= 6 ? 3 : 2 : null}>{feedback === 'correct' ? 'Kural çözüldü!' : feedback ? `Doğru cevap ${question.answer}.` : `Süre ${seconds}s · combo ${combo}`}</GameFeedback></div></GameShell>
}
export default NumberSequenceGame
