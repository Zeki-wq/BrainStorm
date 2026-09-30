import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_LEVELS = 5
const MAX_ATTEMPTS = 8
const lengthFor = level => level <= 1 ? 3 : level <= 3 ? 4 : 5
const clueCount = level => [4, 5, 6, 7, 8][level - 1]
function permuteDigits(length) {
  const result = []
  function visit(prefix, pool) { if (prefix.length === length) { result.push(prefix); return } pool.forEach((digit, i) => visit(prefix + digit, pool.filter((_, j) => j !== i))) }
  visit('', '0123456789'.split(''))
  return result
}
function shuffle(list) { const a = [...list]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
function puzzleFor(level) {
  const length = lengthFor(level)
  const possibilities = permuteDigits(length)
  const validSecrets = possibilities.filter(code => +code[0] === +code.at(-1) + 2)
  const secret = validSecrets[Math.floor(Math.random() * validSecrets.length)]
  const clues = []
  clues.push({ text: 'İlk rakam son rakamdan 2 büyüktür.', test: code => +code[0] === +code.at(-1) + 2 })
  const total = [...secret].reduce((s, n) => s + +n, 0)
  clues.push({ text: `Rakamların toplamı ${total}.`, test: code => [...code].reduce((s, n) => s + +n, 0) === total })
  const absent = '0123456789'.split('').filter(d => !secret.includes(d))[0]
  clues.push({ text: `${absent} şifrede kullanılmamıştır.`, test: code => !code.includes(absent) })
  const present = secret[Math.floor(Math.random() * length)]
  const wrongPos = [...secret].findIndex(d => d !== present)
  clues.push({ text: `${present} şifrede vardır ama ${wrongPos + 1}. sırada değildir.`, test: code => code.includes(present) && code[wrongPos] !== present })
  if (length >= 4) {
    const a = Math.floor(Math.random() * (length - 1)); const b = a + 1; const sum = +secret[a] + +secret[b]
    clues.push({ text: `${a + 1}. ve ${b + 1}. rakamın toplamı ${sum}.`, test: code => +code[a] + +code[b] === sum })
  }
  const oddCount = [...secret].filter(d => +d % 2).length
  clues.push({ text: `Şifrede ${oddCount} tek rakam bulunur.`, test: code => [...code].filter(d => +d % 2).length === oddCount })
  for (let i = 0; i < length; i += 1) {
    const digit = secret[i]
    const otherPosition = (i + 1) % length
    clues.push({ text: `${digit}, ${i + 1}. sıradadır.`, test: code => code[i] === digit })
    clues.push({ text: `${digit}, ${otherPosition + 1}. sırada değildir.`, test: code => code[otherPosition] !== digit })
  }
  const selected = []
  let remaining = possibilities
  for (const clue of shuffle(clues)) {
    if (remaining.length <= 1) break
    const narrowed = remaining.filter(clue.test)
    if (narrowed.length && narrowed.length < remaining.length) { selected.push(clue); remaining = narrowed }
  }
  if (remaining.length > 1) {
    for (let i = 0; i < length && remaining.length > 1; i += 1) {
      const digit = secret[i]
      const clue = { text: `${i + 1}. sıradaki rakam ${digit}.`, test: code => code[i] === digit }
      const narrowed = remaining.filter(clue.test)
      if (narrowed.length < remaining.length) { selected.push(clue); remaining = narrowed }
    }
  }
  for (const clue of shuffle(clues)) {
    if (selected.length >= clueCount(level)) break
    if (!selected.some(item => item.text === clue.text)) selected.push(clue)
  }
  return { secret, clues: selected }
}
function feedback(secret, guess) {
  let exact = 0; const s = {}; const g = {}
  for (let i = 0; i < secret.length; i += 1) { if (secret[i] === guess[i]) exact += 1; else { s[secret[i]] = (s[secret[i]] || 0) + 1; g[guess[i]] = (g[guess[i]] || 0) + 1 } }
  const misplaced = Object.keys(g).reduce((n, d) => n + Math.min(g[d], s[d] || 0), 0)
  return { exact, misplaced, absent: secret.length - exact - misplaced }
}

function SafeCrackerGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [puzzle, setPuzzle] = useState(() => puzzleFor(1))
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [phase, setPhase] = useState('playing')
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [solved, setSolved] = useState(0)
  const [complete, setComplete] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [shake, setShake] = useState(false)
  const length = lengthFor(level)
  useEffect(() => { if (phase !== 'playing' || complete) return undefined; const timer = window.setInterval(() => setSeconds(s => s + 1), 1000); return () => window.clearInterval(timer) }, [phase, complete, level])
  useEffect(() => { if (!feedbackText) return undefined; const timer = window.setTimeout(() => setFeedbackText(''), 900); return () => window.clearTimeout(timer) }, [feedbackText])
  useEffect(() => { if (!shake) return undefined; const timer = window.setTimeout(() => setShake(false), 360); return () => window.clearTimeout(timer) }, [shake])
  function submit(event) {
    event.preventDefault()
    if (phase !== 'playing' || input.length !== length) return
    const guess = input
    if (new Set(guess).size !== guess.length) { setErrors(n => n + 1); setInput(''); setFeedbackText('Rakamlar tekrar etmemeli.'); setShake(true); return }
    const result = feedback(puzzle.secret, guess)
    const attempt = history.length + 1
    setHistory(rows => [...rows, { guess, ...result }]); setInput('')
    if (guess === puzzle.secret) { setPhase('solved'); setSolved(n => n + 1); setScore(s => s + Math.max(100, 1200 - attempt * 100 - seconds * 4)); setTotalSeconds(s => s + seconds) }
    else { setErrors(n => n + 1); setFeedbackText('Kilit geri itti · ipuçlarını yeniden incele.'); setShake(true); if (attempt >= MAX_ATTEMPTS) setPhase('failed') }
  }
  function nextLevel() { const next = level + 1; setLevel(next); setPuzzle(puzzleFor(next)); setInput(''); setHistory([]); setSeconds(0); setPhase('playing') }
  function retry() { setPuzzle(puzzleFor(level)); setInput(''); setHistory([]); setSeconds(0); setPhase('playing') }
  function replay() { setLevel(1); setPuzzle(puzzleFor(1)); setInput(''); setHistory([]); setPhase('playing'); setSeconds(0); setTotalSeconds(0); setScore(0); setErrors(0); setSolved(0); setComplete(false) }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Çözülen kasa<strong>{solved}/{TOTAL_LEVELS}</strong></span><span>Yanlış tahmin<strong>{errors}</strong></span><span>Süre<strong>{totalSeconds} sn</strong></span><span>Level<strong>{level}/{TOTAL_LEVELS}</strong></span></div>
  return <GameShell title="Safe Cracker" category="Logic" score={score} accuracy={ solved + errors > 0 ? solved / (solved + errors) * 100 : null } currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${seconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase === 'solved' || phase === 'failed' ? <section className={`level-success ${phase === 'solved' ? 'safe-unlock' : ''}`}><h2>{phase === 'solved' ? 'Kasa açıldı!' : 'Tahmin hakkı bitti'}</h2><p>{history.length} tahmin · {seconds} saniye</p><button className="primary-button" type="button" onClick={phase === 'failed' ? retry : level === TOTAL_LEVELS ? () => setComplete(true) : nextLevel}>{phase === 'failed' ? 'Tekrar Dene' : level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level'}</button></section> : <div className="safe-game"><p className="new-game-prompt">Level {level} · {length} farklı rakamlı şifreyi çıkar</p><div className="safe-clues"><h3>Kasa ipuçları</h3>{puzzle.clues.map((clue, i) => <p key={`${level}-clue-${i}`}>{i + 1}. {clue.text}</p>)}</div><p className="new-game-hint">Her tahminden sonra konum, bulunan rakam ve kullanılmayan rakam bilgisi gelir.</p><form className="safe-guess-form" onSubmit={submit}><input aria-label="Şifre tahmini" inputMode="numeric" pattern="[0-9]*" maxLength={length} value={input} onChange={event => setInput(event.target.value.replace(/\D/g, '').slice(0, length))} placeholder={'•'.repeat(length)} disabled={phase !== 'playing'} /><button className="primary-button" disabled={input.length !== length}>Kasayı Dene</button></form><div className="safe-wheels">{Array.from({ length }, (_, i) => <span key={i} className={i === input.length ? 'active' : ''}>{input[i] ?? '0'}</span>)}</div><div className="safe-keypad">{Array.from({ length: 10 }, (_, i) => String(i)).map(digit => <button type="button" key={digit} disabled={input.length >= length} onClick={() => setInput(value => (value + digit).slice(0, length))}>{digit}</button>)}<button type="button" onClick={() => setInput(value => value.slice(0, -1))}>⌫</button><button type="button" onClick={() => setInput('')}>AC</button></div><GameFeedback type={feedbackText ? "wrong" : "neutral"} className={shake ? 'screen-shake' : ''}>{feedbackText}</GameFeedback><div className="safe-history">{history.map((row, i) => <p key={`safe-${i}`}><strong>{row.guess}</strong><span>{row.exact} doğru yerde · {row.misplaced} doğru rakam yanlış yerde · {row.absent} bulunmuyor</span></p>)}</div></div>}
  </GameShell>
}
export default SafeCrackerGame
