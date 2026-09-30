import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'

const directions = [
  { id: 'up', label: '↑', key: '↑' }, { id: 'right', label: '→', key: '→' },
  { id: 'down', label: '↓', key: '↓' }, { id: 'left', label: '←', key: '←' },
]
const signals = [
  { glyph: '▲', color: '#b899ed', rule: 'Yönü aynen uygula.', offset: 0 },
  { glyph: '◆', color: '#f0c26c', rule: 'Sarı elmas yönü tersine çevirir.', offset: 2 },
  { glyph: '●', color: '#75d3b0', rule: 'Yeşil daire bir yön saat yönünde döndürür.', offset: 1 },
  { glyph: '⬟', color: '#e98591', rule: 'Kırmızı altıgen bir yön saat yönünün tersine döndürür.', offset: 3 },
]
const choiceFor = (signal, cue) => directions[(directions.findIndex(item => item.id === signal) + cue.offset) % 4]

function makeRound(round) {
  const level = Math.min(5, Math.floor(round / 2) + 1)
  const direction = directions[Math.floor(Math.random() * directions.length)]
  const cue = signals[level === 1 ? 0 : Math.floor(Math.random() * signals.length)]
  return { level, direction, cue, correct: choiceFor(direction.id, cue), duration: Math.max(1050, 3000 - level * 360) }
}

function SignalRushGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [task, setTask] = useState(() => makeRound(0))
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [remaining, setRemaining] = useState(task.duration)
  const [feedback, setFeedback] = useState('Hazır ol…')
  const complete = round >= 12

  useEffect(() => {
    if (complete) return undefined
    const started = performance.now()
    const timer = window.setInterval(() => {
      const left = Math.max(0, task.duration - (performance.now() - started))
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(timer)
        setErrors(value => value + 1)
        setCombo(0)
        setFeedback('Sinyal kaçtı')
        playSfx('wrong')
        const nextTask = makeRound(Math.min(11, round + 1))
        setRound(value => value + 1)
        setTask(nextTask)
        setRemaining(nextTask.duration)
      }
    }, 60)
    return () => window.clearInterval(timer)
  }, [round, task, complete])

  useEffect(() => { if (!complete) playSfx('signal') }, [round, complete])

  const answer = useCallback(id => {
    if (complete || remaining <= 0) return
    if (id === task.correct.id) {
      const nextCombo = combo + 1
      setCorrect(value => value + 1)
      setCombo(nextCombo)
      setScore(value => value + Math.round(100 + remaining / 25 + Math.min(nextCombo, 8) * 12))
      setFeedback(nextCombo > 1 ? `DOĞRU · COMBO ×${Math.min(nextCombo, 8)}` : 'DOĞRU · +100')
      playSfx(nextCombo > 2 ? 'combo' : 'correct')
    } else {
      setErrors(value => value + 1)
      setCombo(0)
      setScore(value => Math.max(0, value - 35))
      setFeedback('Yanlış yön · combo sıfırlandı')
      playSfx('wrong')
    }
    const nextTask = makeRound(round + 1)
    setRound(value => value + 1)
    setTask(nextTask)
    setRemaining(nextTask.duration)
  }, [complete, remaining, task, combo, round])

  const answerRef = useRef(null)
  useEffect(() => { answerRef.current = answer }, [answer])
  useEffect(() => {
    const onKey = event => {
      const keyMap = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' }
      if (keyMap[event.key]) { event.preventDefault(); answerRef.current?.(keyMap[event.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <GameShell title="Signal Rush" category="Attention / Speed" score={score} currentRound={complete ? 12 : round + 1} totalRounds={12} isComplete={complete} accuracy={round ? correct / round * 100 : null} result={`Skor ${score} · doğru ${correct} · hata ${errors} · combo ×${combo}`} onReplay={() => { const fresh = makeRound(0); setRound(0); setTask(fresh); setRemaining(fresh.duration); setScore(0); setCorrect(0); setErrors(0); setCombo(0); setFeedback('Hazır ol…') }} onBack={onBack}>
    {!complete && <div className="signal-rush-game">
      <div className="signal-rush-hud"><span>LEVEL {task.level}</span><span className={remaining < 600 ? 'urgent' : ''}>{(remaining / 1000).toFixed(1)}s</span><span>COMBO ×{combo}</span></div>
      <p className="signal-rush-rule">{task.cue.rule}</p>
      <p className="game-skill-note">Bu tur, görsel sinyali hızlı yorumlama ve kuralı uygulama becerisine odaklanır.</p>
      <div className="signal-rush-display" style={{ '--signal-color': task.cue.color }}><span>{task.cue.glyph}</span><strong>{task.direction.label}</strong></div>
      <p className="signal-rush-feedback" aria-live="polite">{feedback}</p>
      <div className="signal-rush-pad" aria-label="Yön seçimi">{directions.map(direction => <button type="button" key={direction.id} onClick={() => answer(direction.id)} aria-label={`${direction.key} yönü`}>{direction.label}<small>{direction.key}</small></button>)}</div>
      <p className="signal-rush-help">Ok tuşlarıyla da cevap verebilirsin</p>
    </div>}
  </GameShell>
}

export default SignalRushGame
