import { useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_LEVELS = 10
const TIME_LIMITS = [90, 80, 70, 60, 50, 45, 40, 35, 30, 25]
const MODULE_COUNTS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7]
const GLYPHS = ['▲', '●', '■', '★', '◆', '⬟']
const COLORS = ['KIRMIZI', 'MAVİ', 'YEŞİL', 'SARI', 'MOR']
const countFor = level => MODULE_COUNTS[Math.min(level - 1, MODULE_COUNTS.length - 1)]
const timeFor = level => TIME_LIMITS[Math.min(level - 1, TIME_LIMITS.length - 1)]
function shuffle(values) { const a = [...values]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
function makeModule(type, level) {
  let choices; let answer; let prompt; let sequence
  if (type === 'WIRE') {
    const colors = shuffle(COLORS).slice(0, 4); const lengths = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)
    if (Math.random() < 0.5) { const longest = lengths.indexOf(Math.max(...lengths)); answer = colors[longest]; prompt = `En uzun rengi seç: ${colors.map((color, i) => `${i + 1}. ${color} (${lengths[i]})`).join(' · ')}` }
    else { const target = colors[2]; answer = target; prompt = `3. işaretle aynı renkte olanı seç: ${colors.map((color, i) => `${i + 1}. ${color}`).join(' · ')}` }
    choices = colors
  } else if (type === 'SYMBOL') {
    const symbols = shuffle(GLYPHS).slice(0, 4)
    prompt = `Sembolleri sırala: ${symbols.join('  ')} · Soldan ${level % 2 ? '2.' : '3.'} sembolü seç.`
    answer = symbols[level % 2 ? 1 : 2]; choices = symbols
  } else if (type === 'SEQUENCE') {
    const start = 2 + Math.floor(Math.random() * 5); const step = 2 + Math.floor(Math.random() * 4)
    const alternating = level >= 4 && Math.random() < 0.5
    const values = alternating ? [start, start + 3, (start + 3) * 2, (start + 3) * 2 + 3] : [start, start + step, start + step * 2]
    answer = alternating ? values.at(-1) * 2 : values.at(-1) + step
    choices = [answer - 2, answer, answer + 1, answer + 3].map(String)
    prompt = `${values.join(' → ')} → ?`
  } else if (type === 'MEMORY') {
    sequence = Array.from({ length: 5 + Math.floor(level / 4) }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
    answer = sequence.at(-2); choices = shuffle([...new Set([answer, ...shuffle(GLYPHS.filter(symbol => symbol !== answer)).slice(0, 3)])])
    prompt = 'Dizide sondan 2. sembolü seç.'
  } else if (type === 'LOGIC') {
    const names = shuffle(['A', 'B', 'C', 'D']); const colors = shuffle(COLORS).slice(0, 4)
    const solution = names.map((name, i) => `${name}=${colors[i]}`)
    answer = solution[Math.floor(Math.random() * solution.length)].split('=')[0]
    const targetColor = colors[names.indexOf(answer)]
    prompt = `Eşleşme paneli: ${solution.filter(item => !item.startsWith(`${answer}=`)).join(' · ')} · ${targetColor} hangi harf?`
    choices = names
  } else if (type === 'COLOR') {
    const colors = shuffle(COLORS).slice(0, 4); const number = 1 + Math.floor(Math.random() * 9)
    answer = colors[number % colors.length]; choices = colors
    prompt = `Panel ${number} gösteriyor. Tek sayıysa 1., çift sayıysa 2. rengi seç: ${colors.slice(0, 2).join(' / ')}`
    answer = colors[number % 2 ? 0 : 1]
  } else if (type === 'NUMBER') {
    const left = 7 + Math.floor(Math.random() * (10 + level)); const right = 3 + Math.floor(Math.random() * 9)
    answer = left + right; choices = [answer - 3, answer, answer + 2, answer + 5].map(String); prompt = `${left} + ${right} = ?`
  } else if (type === 'SWITCH') {
    const sequence = shuffle(['A', 'B', 'C']).slice(0, 2); const initial = [0, 0, 0]
    const toggle = { A: [0, 1], B: [1, 2], C: [0, 2] }
    sequence.forEach(button => toggle[button].forEach(index => { initial[index] = 1 - initial[index] }))
    answer = initial.join(''); choices = ['000', '011', '101', '110'].filter(value => value !== answer).slice(0, 3); choices = [...choices, answer]
    prompt = `000 başlangıcında ${sequence.join(' → ')} düğmelerine bas. Son durumu seç (A-B-C):`
  } else {
    const symbols = shuffle(GLYPHS).slice(0, 3)
    sequence = Array.from({ length: 5 }, (_, i) => symbols[i % symbols.length])
    answer = symbols[5 % symbols.length]; choices = shuffle([...new Set([answer, ...GLYPHS.filter(g => !symbols.includes(g)).slice(0, 3)])])
    prompt = `Örüntü: ${sequence.join(' ')} ? · döngüyü tamamla.`
  }
  if (!Array.isArray(choices) || !choices.includes(answer)) choices = [...(choices || []), answer]
  choices = shuffle([...new Set(choices.map(String))])
  return { id: `${Date.now()}-${Math.random()}`, type, prompt, answer: String(answer), choices, sequence: type === 'MEMORY' ? sequence : null }
}
function makeDevice(level) {
  const types = shuffle(['WIRE', 'SYMBOL', 'SEQUENCE', 'MEMORY', 'LOGIC', 'COLOR', 'NUMBER', 'SWITCH', 'PATTERN'])
  return Array.from({ length: countFor(level) }, (_, i) => makeModule(types[i % types.length], level))
}

function BombDefusalGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [modules, setModules] = useState(() => makeDevice(1))
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(timeFor(1))
  const [levelElapsed, setLevelElapsed] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [errors, setErrors] = useState(0)
  const [solvedModules, setSolvedModules] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [phase, setPhase] = useState('playing')
  const [feedback, setFeedback] = useState('')
  const [feedbackKind, setFeedbackKind] = useState('neutral')
  const [lastPoints, setLastPoints] = useState(null)
  const [hiddenMemoryId, setHiddenMemoryId] = useState(null)
  const [complete, setComplete] = useState(false)
  const current = modules[index]
  const combo = streak >= 10 ? 5 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1
  const hot = seconds <= 10
  const progress = useMemo(() => modules.map((item, i) => ({ ...item, state: i < index ? 'solved' : i === index ? 'active' : 'pending' })), [modules, index])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const timer = window.setInterval(() => {
      setSeconds(value => { if (value <= 1) { setPhase('explosion'); setFeedback('SYSTEM FAILURE'); setFeedbackKind('wrong'); return 0 } return value - 1 })
      setLevelElapsed(value => value + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, level])
  useEffect(() => {
    if (phase === 'playing' && (seconds === 10 || seconds <= 5)) playSfx('warning')
  }, [seconds, phase])
  useEffect(() => {
    if (phase !== 'explosion') return undefined
    playSfx('explosion')
    const timer = window.setTimeout(() => setPhase('failed'), 1250)
    return () => window.clearTimeout(timer)
  }, [phase])
  useEffect(() => { if (phase === 'success') playSfx('levelComplete') }, [phase])
  useEffect(() => {
    if (phase !== 'playing' || current?.type !== 'MEMORY') return undefined
    const timer = window.setTimeout(() => setHiddenMemoryId(current.id), Math.max(900, 2200 - level * 100))
    return () => window.clearTimeout(timer)
  }, [phase, current, level])
  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => { setFeedback(''); setLastPoints(null) }, 900)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function choose(option) {
    if (phase !== 'playing' || feedback || !current) return
    if (String(option) !== current.answer) {
      setErrors(n => n + 1); setStreak(0); setScore(value => Math.max(0, value - 60)); setSeconds(value => Math.max(0, value - 5)); setFeedback('Yanlış modül cevabı · 5 saniye ceza'); setFeedbackKind('wrong'); setLastPoints(-60); return
    }
    const nextStreak = streak + 1
    const points = (150 + seconds * 4) * (nextStreak >= 10 ? 5 : nextStreak >= 5 ? 3 : nextStreak >= 3 ? 2 : 1)
    setStreak(nextStreak); setBestStreak(value => Math.max(value, nextStreak)); setScore(value => value + points); setLastPoints(points); setFeedbackKind('correct'); setFeedback(`MODÜL ${current.type} ÇÖZÜLDÜ`); setSolvedModules(n => n + 1)
    if (index + 1 >= modules.length) { setTotalTime(value => value + levelElapsed); setPhase('success') }
    else setIndex(value => value + 1)
  }
  function setup(nextLevel) { setLevel(nextLevel); setModules(makeDevice(nextLevel)); setIndex(0); setSeconds(timeFor(nextLevel)); setLevelElapsed(0); setFeedback(''); setFeedbackKind('neutral'); setLastPoints(null); setStreak(0); setPhase('playing') }
  function retry() { setup(level) }
  function replay() { setErrors(0); setSolvedModules(0); setScore(0); setStreak(0); setBestStreak(0); setTotalTime(0); setComplete(false); setup(1) }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Çözülen modül<strong>{solvedModules}</strong></span><span>Hata<strong>{errors}</strong></span><span>En iyi combo<strong>×{bestStreak >= 10 ? 5 : bestStreak >= 5 ? 3 : bestStreak >= 3 ? 2 : 1}</strong></span><span>Süre<strong>{totalTime} sn</strong></span></div>
  return <GameShell title="Bomb Defusal" category="Logic" score={score} accuracy={ solvedModules + errors > 0 ? solvedModules / (solvedModules + errors) * 100 : null } currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${seconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase === 'success' || phase === 'failed' ? <section className={`level-success ${phase === 'failed' ? 'game-failure' : 'device-secured'}`}><p className="eyebrow">{phase === 'success' ? 'DEVICE SECURED' : 'SYSTEM FAILURE'}</p><h2>{phase === 'success' ? `Level ${level} tamamlandı` : 'Cihaz zamanında çözülemedi'}</h2><p>{index + (phase === 'success' ? 1 : 0)}/{modules.length} modül · {levelElapsed}s · {errors} hata</p><button className="primary-button" type="button" onClick={phase === 'success' ? level === TOTAL_LEVELS ? () => setComplete(true) : () => setup(level + 1) : retry}>{phase === 'success' ? level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level' : 'Tekrar Dene'}</button></section> : <div className={`bomb-game ${hot ? 'bomb-warning screen-shake' : ''} ${phase === 'explosion' ? 'bomb-explosion' : ''}`}>
      <div className="bomb-hud"><div><span>SIMULATION DEVICE</span><strong>LEVEL {String(level).padStart(2, '0')}</strong></div><div className={`bomb-clock ${hot ? 'critical' : ''}`}><small>{hot ? 'WARNING' : 'TIMER'}</small><strong>{String(seconds).padStart(2, '0')}<i>SEC</i></strong></div><div><span>ERROR</span><strong>{errors}</strong></div></div>
      <p className="new-game-prompt">Modül {index + 1}/{modules.length} · hızlı ve hatasız çöz</p>
      <div className="bomb-module-track">{progress.map((module, i) => <span key={module.id} className={module.state}>{module.type}<i>{module.state === 'solved' ? '✓' : i + 1}</i></span>)}</div>
      {current && <section className={`bomb-module-panel ${current.type.toLowerCase()}`}><p className="bomb-module-type">{current.type} MODULE</p><p>{current.sequence && <strong className={`bomb-memory-sequence ${hiddenMemoryId !== current.id ? 'visible' : 'hidden'}`}>{hiddenMemoryId !== current.id ? current.sequence.join('  ') : '●  ?  ?  ?  ?'}</strong>}</p><p>{current.prompt}</p><div className="bomb-choices">{current.choices.map((choice, i) => <button type="button" key={`${current.id}-${choice}-${i}`} onClick={() => choose(choice)}>{choice}</button>)}</div></section>}
      <GameFeedback type={feedbackKind} points={lastPoints} combo={combo}>{feedback || `STREAK ${streak} · COMBO ×${combo}`}</GameFeedback>
      {phase === 'explosion' && <div className="bomb-explosion-overlay">SIMULATION OVERLOAD</div>}
    </div>}
  </GameShell>
}

export default BombDefusalGame
