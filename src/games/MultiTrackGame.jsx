import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_ROUNDS = 8
function randomDirection() { return Math.random() < 0.5 ? -1 : 1 }

function makeRound(round) {
  const count = Math.min(4 + round - 1, 8)
  const tokens = []
  for (let id = 0; id < count; id += 1) {
    let x = 50
    const y = ((id + 1) / (count + 1)) * 100
    for (let attempt = 0; attempt < 40; attempt += 1) {
      x = 12 + Math.random() * 76
      if (tokens.every(token => Math.hypot(token.x - x, token.y - y) > 16)) break
    }
    tokens.push({ id, x, y, dx: randomDirection(), speed: 1.2 + Math.random() * (1 + round * 0.2) })
  }
  return { tokens, target: Math.floor(Math.random() * count) }
}

function moveTokens(tokens) {
  return tokens.map(token => {
    let dx = token.dx
    let x = token.x + dx * token.speed * 2.4
    if (x < 7 || x > 93) { dx *= -1; x = Math.max(7, Math.min(93, x)) }
    return { ...token, x, dx }
  })
}

function MultiTrackGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [game, setGame] = useState(() => makeRound(1))
  const [tokens, setTokens] = useState(game.tokens)
  const [phase, setPhase] = useState('preview')
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [feedback, setFeedback] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [answerTimes, setAnswerTimes] = useState([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [points, setPoints] = useState(null)
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (phase === 'preview') {
      const timer = window.setTimeout(() => setPhase('moving'), Math.max(650, 1050 - round * 35))
      return () => window.clearTimeout(timer)
    }
    if (phase === 'moving') {
      const interval = window.setInterval(() => setTokens(current => moveTokens(current)), 180)
      const duration = 1500 + round * 260
      const timer = window.setTimeout(() => { window.clearInterval(interval); setPhase('choose'); setStartedAt(performance.now()) }, duration)
      return () => { window.clearInterval(interval); window.clearTimeout(timer) }
    }
    if (phase === 'feedback') {
      const timer = window.setTimeout(() => {
        setPoints(null)
        if (round === TOTAL_ROUNDS) { setRound(TOTAL_ROUNDS + 1); setPhase('done'); setFeedback(null); return }
        const next = round + 1
        const nextGame = makeRound(next)
        setRound(next); setGame(nextGame); setTokens(nextGame.tokens); setPhase('preview'); setFeedback(null)
      }, 500)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [phase, round])

  function choose(id, event) {
    if (phase !== 'choose') return
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    const isCorrect = id === game.target
    setAnswerTimes(times => [...times, elapsed]); setFeedback(isCorrect ? 'correct' : 'wrong'); setPhase('feedback')
    if (isCorrect) { const nextStreak = streak + 1; const multiplier = nextStreak >= 10 ? 4 : nextStreak >= 6 ? 3 : nextStreak >= 3 ? 2 : 1; const gained = (150 + Math.max(0, Math.round(300 - elapsed / 20))) * multiplier; setStreak(nextStreak); setBestStreak(value => Math.max(value, nextStreak)); setCorrect(value => value + 1); setScore(value => value + gained); setPoints(gained) }
    else { setStreak(0); setErrors(value => value + 1); setScore(value => Math.max(0, value - 35)); setPoints(-35) }
  }

  function replay() {
    const next = makeRound(1)
    setRound(1); setGame(next); setTokens(next.tokens); setPhase('preview'); setStartedAt(performance.now()); setFeedback(null)
    setCorrect(0); setErrors(0); setScore(0); setAnswerTimes([]); setStreak(0); setBestStreak(0); setPoints(null)
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span><span>En uzun seri<strong>{bestStreak}</strong></span></div>

  return <GameShell title="Multi Track" category="Memory" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="multi-track-game">
      <p className="new-game-prompt">{phase === 'preview' ? 'Parlayan daireyi takip et' : phase === 'moving' ? 'Yörüngesini gözünle izle…' : phase === 'choose' ? 'Hedef daireye dokun' : feedback === 'correct' ? 'Doğru takip!' : 'Hedefi kaçırdın.'}</p>
      <div className={`multi-track-board ${phase}`}>
        {tokens.map(token => <div className="track-lane" key={`lane-${token.id}`} style={{ top: `${token.y}%` }} aria-hidden="true" />)}
        {tokens.map(token => <button className={`track-token${phase === 'preview' && token.id === game.target ? ' tracked' : ''}`} type="button" key={token.id} onClick={event => choose(token.id, event)} disabled={phase !== 'choose'} style={{ left: `${token.x}%`, top: `${token.y}%` }} aria-label={`Track ${token.id + 1} üzerindeki obje`} />)}
      </div>
      <GameFeedback type={feedback ?? 'neutral'} points={points} combo={streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : null}>{phase === 'feedback' ? feedback === 'correct' ? 'Hedefi takip ettin!' : 'Hedef kayboldu · sonraki turda odaklan.' : phase === 'preview' ? `Hedefi gözünde tut · seri ${streak}` : phase === 'moving' ? 'Gözün hedefte kalsın…' : 'Hedefi seç.'}</GameFeedback>
      <p className="new-game-hint">{tokens.length} obje · tur {round}</p>
    </div>
  </GameShell>
}

export default MultiTrackGame
