import { useEffect, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_ROUNDS = 10
const EVENTS = {
  green: { label: 'GREEN', action: 'TIKLA', color: '#54bd89', rule: 'Yeşil görünürse bir kez tıkla.' },
  red: { label: 'RED', action: 'DOKUNMA', color: '#e66c79', rule: 'Kırmızı görünürse hiç tıklama.' },
  blue: { label: 'BLUE', action: 'ÇİFT TIKLA', color: '#709deb', rule: 'Mavi görünürse iki kez hızlı tıkla.' },
  yellow: { label: 'YELLOW', action: 'BEKLE', color: '#e9c45e', rule: 'Sarı görünürse bekle, hedefe dokunma.' },
}
function chooseEvent(round) {
  const pool = round < 3 ? ['green'] : round < 5 ? ['green', 'red'] : round < 7 ? ['green', 'red', 'blue'] : ['green', 'red', 'blue', 'yellow']
  return pool[Math.floor(Math.random() * pool.length)]
}

function ReactionGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [eventType, setEventType] = useState(() => chooseEvent(1))
  const [status, setStatus] = useState('waiting')
  const [times, setTimes] = useState([])
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [points, setPoints] = useState(null)
  const presses = useRef(0)
  const complete = status === 'complete'
  const current = EVENTS[eventType]
  const average = times.length ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length) : null
  const score = Math.max(0, correct * 120 + bestStreak * 30 - errors * 75 + times.reduce((sum, time) => sum + Math.max(0, 180 - Math.round(time / 15)), 0))

  function resolve(success, elapsed, message) {
    const time = Math.max(0, elapsed)
    setTimes(values => [...values, time]); setFeedbackText(message); setPoints(success ? 120 : -75); setStatus('feedback')
    if (success) { setCorrect(value => value + 1); setStreak(value => { const next = value + 1; setBestStreak(best => Math.max(best, next)); return next }) }
    else { setErrors(value => value + 1); setStreak(0) }
  }

  useEffect(() => {
    let timer
    if (status === 'waiting') timer = window.setTimeout(() => { presses.current = 0; setStartedAt(performance.now()); setStatus('active') }, Math.max(420, 1500 - round * 70) + Math.random() * Math.max(250, 1000 - round * 55))
    if (status === 'active') {
      const baseWindow = eventType === 'yellow' ? 1500 : eventType === 'red' ? 1050 : eventType === 'blue' ? 720 : 1800
      const windowMs = Math.max(eventType === 'blue' ? 430 : 680, baseWindow - (round - 1) * (eventType === 'blue' ? 30 : 65))
      timer = window.setTimeout(() => {
        const elapsed = Math.round(performance.now() - startedAt)
        if (eventType === 'red' || eventType === 'yellow') resolve(true, elapsed, eventType === 'red' ? 'İnhibisyon doğru · erken tıklamadın.' : 'Sarı sinyali bekledin!')
        else resolve(false, elapsed, eventType === 'blue' ? 'İkinci tık yetişmedi.' : 'Sinyal kaçtı.')
      }, windowMs)
    }
    if (status === 'feedback') timer = window.setTimeout(() => {
      if (round >= TOTAL_ROUNDS) setStatus('complete')
      else { const next = round + 1; setRound(next); setEventType(chooseEvent(next)); setPoints(null); setFeedbackText(''); setStatus('waiting') }
    }, 850)
    return () => window.clearTimeout(timer)
  }, [round, status, eventType, startedAt])

  function handleTargetClick() {
    if (status === 'waiting') { resolve(false, 0, 'Erken tıklama! Sinyali bekle.'); return }
    if (status !== 'active') return
    const elapsed = performance.now() - startedAt
    if (eventType === 'green') resolve(true, elapsed, 'Hızlı tepki!')
    else if (eventType === 'blue') {
      presses.current += 1
      if (presses.current === 1) { setFeedbackText('Bir tık daha!'); return }
      resolve(elapsed <= 720 ? true : false, elapsed, elapsed <= 720 ? 'Çift tık tamam!' : 'Çift tık çok yavaştı.')
    } else resolve(false, elapsed, eventType === 'red' ? 'Kırmızıda tıklamamalıydın.' : 'Sarı sinyalinde beklemeliydin.')
  }
  function replay() { presses.current = 0; setRound(1); setEventType(chooseEvent(1)); setStatus('waiting'); setTimes([]); setCorrect(0); setErrors(0); setStreak(0); setBestStreak(0); setStartedAt(null); setFeedbackText(''); setPoints(null) }
  const result = <div className="reaction-result-stats"><span>Doğru <strong>{correct}</strong></span><span>Hata <strong>{errors}</strong></span><span>Ortalama <strong>{average === null ? '—' : `${average} ms`}</strong></span><span>En iyi seri <strong>{bestStreak}</strong></span><span>Skor <strong>{score}</strong></span></div>
  return <GameShell title="Reaction" category="Hız" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className={`reaction-zone ${status}`}>
      <p className="reaction-instruction">{status === 'waiting' ? 'Sinyali bekle…' : status === 'active' ? current.rule : status === 'feedback' ? feedbackText : 'Shift complete'}</p>
      {status !== 'complete' && <button className={`reaction-target reaction-${eventType}`} type="button" onClick={handleTargetClick} aria-label={status === 'active' ? current.action : 'Sinyali bekle'}>{status === 'waiting' ? 'READY' : status === 'active' ? current.label : '✓'}</button>}
      {status === 'active' && <div className="reaction-action-label">{current.action}</div>}
      {status === 'feedback' && <GameFeedback type={points > 0 ? 'correct' : 'wrong'} points={points} combo={streak >= 3 ? streak : null}>{feedbackText}</GameFeedback>}
      <div className="reaction-round-label">Tur {round}/{TOTAL_ROUNDS} · seri {streak}</div>
    </div>
  </GameShell>
}

export default ReactionGame
