import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { shuffle } from '../utils/gameRandom.js'

const shapes = ['▲', '◆', '●', '■', '⬟', '★']
const colors = [{ name: 'menekşe', value: '#b89ae8' }, { name: 'turkuaz', value: '#68cfbd' }, { name: 'amber', value: '#e8ba65' }, { name: 'mercan', value: '#e88491' }]
const sizes = ['KÜÇÜK', 'ORTA', 'BÜYÜK']

function makeRound(round) {
  const level = Math.min(5, Math.floor(round / 2) + 1)
  const operationKinds = ['shape', 'color', 'size', 'rotate']
  const operations = shuffle(operationKinds).slice(0, Math.min(4, level))
  const state = { shape: Math.floor(Math.random() * shapes.length), color: Math.floor(Math.random() * colors.length), size: Math.floor(Math.random() * sizes.length), rotate: Math.floor(Math.random() * 4) }
  const rules = operations.map(type => {
    const amount = type === 'rotate' ? 1 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * (type === 'shape' ? 2 : 1))
    if (type === 'shape') return { type, amount, label: `Şekli sıradaki ${amount === 1 ? 'bir' : 'iki'} konuma taşı` }
    if (type === 'color') return { type, amount, label: 'Rengi renk çemberinde bir adım ilerlet' }
    if (type === 'size') return { type, amount, label: `Boyutu ${amount === 1 ? 'bir' : 'iki'} kademe büyüt; sona gelince başa dön` }
    return { type, amount, label: `Şekli saat yönünde ${amount * 90}° döndür` }
  })
  const output = { ...state }
  for (const rule of rules) output[rule.type] = (output[rule.type] + rule.amount) % (rule.type === 'shape' ? shapes.length : rule.type === 'color' ? colors.length : rule.type === 'size' ? sizes.length : 4)
  const distractors = [
    { ...output, shape: (output.shape + 1) % shapes.length },
    { ...output, color: (output.color + 1) % colors.length },
    { ...output, size: (output.size + 1) % sizes.length },
  ]
  const choices = shuffle([{ ...output, correct: true }, ...distractors.map(item => ({ ...item, correct: false }))])
  return { level, state, rules, choices, duration: Math.max(2200, 7500 - level * 800) }
}

function ForgeToken({ token, small = false }) {
  return <span className={`forge-token${small ? ' small' : ''}`} style={{ '--forge-color': colors[token.color].value, '--forge-size': `${[35, 48, 61][token.size]}px`, '--forge-rotation': `${token.rotate * 90}deg` }}>{shapes[token.shape]}</span>
}

function PatternForgeGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [task, setTask] = useState(() => makeRound(0))
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [feedback, setFeedback] = useState('Dönüşüm kurallarını sırayla uygula.')
  const [remaining, setRemaining] = useState(task.duration)
  const answerRef = useRef(null)
  const complete = round >= 12

  const answer = useCallback((choice, timedOut = false) => {
    if (complete || (remaining <= 0 && !timedOut)) return
    const right = Boolean(choice?.correct)
    const nextCombo = right ? combo + 1 : 0
    if (right) { setCorrect(value => value + 1); setCombo(nextCombo); setScore(value => value + 110 + Math.floor(remaining / 100) + Math.min(nextCombo, 5) * 14); setFeedback(`Dönüşüm doğru · COMBO ×${nextCombo}`); playSfx(nextCombo > 2 ? 'combo' : 'correct') }
    else { setErrors(value => value + 1); setCombo(0); setScore(value => Math.max(0, value - 35)); setFeedback(timedOut ? 'Süre doldu · kalıba yeniden odaklan' : 'Kural zincirinde bir adım kaçtı'); playSfx('wrong') }
    const next = round + 1
    const fresh = makeRound(next)
    setRound(next); setTask(fresh); setRemaining(fresh.duration)
  }, [complete, remaining, combo, round])
  useEffect(() => { answerRef.current = answer }, [answer])

  useEffect(() => {
    if (complete) return undefined
    const start = performance.now()
    const timer = window.setInterval(() => {
      const left = Math.max(0, task.duration - (performance.now() - start))
      setRemaining(left)
      if (left === 0) { window.clearInterval(timer); answerRef.current?.(null, true) }
    }, 80)
    return () => window.clearInterval(timer)
  }, [round, task, complete])
  useEffect(() => {
    const onKey = event => { const index = Number(event.key) - 1; if (index >= 0 && index < task.choices.length) answerRef.current?.(task.choices[index]) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [round, task])

  function replay() { const fresh = makeRound(0); setRound(0); setTask(fresh); setRemaining(fresh.duration); setScore(0); setCorrect(0); setErrors(0); setCombo(0); setFeedback('Dönüşüm kurallarını sırayla uygula.') }
  return <GameShell title="Pattern Forge" category="Logic / Pattern Recognition" score={score} currentRound={complete ? 12 : round + 1} totalRounds={12} isComplete={complete} accuracy={round ? correct / round * 100 : null} result={`Skor ${score} · doğru ${correct} · hata ${errors} · en uzun combo ×${combo}`} onReplay={replay} onBack={onBack}>
    {!complete && <div className="pattern-forge-game">
      <div className="forge-hud"><span>FORGE LEVEL {task.level}</span><span>{(remaining / 1000).toFixed(1)}s</span><span>COMBO ×{combo}</span></div>
      <div className="forge-machine"><div className="forge-stage"><small>GİRDİ</small><ForgeToken token={task.state} /></div><div className="forge-arrow">→</div><div className="forge-stage forge-output"><small>ÇIKTIYI TAHMİN ET</small><span className="forge-question">?</span></div></div>
      <p className="game-skill-note">Şekil ve özellikleri zihninde dönüştürerek kural zincirini çöz.</p>
      <section className="forge-rules"><small>MAKİNE KURALLARI · SIRAYLA UYGULA</small>{task.rules.map((rule, index) => <p key={`${rule.type}-${index}`}><b>0{index + 1}</b>{rule.label}</p>)}</section>
      <p className="forge-feedback" aria-live="polite">{feedback}</p>
      <div className="forge-options">{task.choices.map((choice, index) => <button type="button" key={index} onClick={() => answer(choice)} aria-label={`Seçenek ${index + 1}: ${shapes[choice.shape]}, ${colors[choice.color].name}, ${sizes[choice.size]}`}><ForgeToken token={choice} small /><span>{colors[choice.color].name} · {sizes[choice.size]} · {choice.rotate * 90}°</span><kbd>{index + 1}</kbd></button>)}</div>
    </div>}
  </GameShell>
}

export default PatternForgeGame
