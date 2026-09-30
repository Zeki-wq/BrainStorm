import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_LEVELS = 4
const COLORS = [
  { id: 'coral', name: 'Mercan', value: '#ef737e' }, { id: 'blue', name: 'Mavi', value: '#73a8f4' },
  { id: 'mint', name: 'Nane', value: '#70d2a0' }, { id: 'gold', name: 'Altın', value: '#f0cc67' },
  { id: 'violet', name: 'Mor', value: '#b28be8' }, { id: 'white', name: 'Fildişi', value: '#e7ddeb' },
]
const lengthFor = level => level === 1 || level === 2 ? 4 : level === 3 ? 5 : 6
const paletteFor = level => level === 1 ? 4 : level === 2 ? 5 : 6
const MAX_GUESSES = 8
const randomCode = (level) => Array.from({ length: lengthFor(level) }, () => COLORS[Math.floor(Math.random() * paletteFor(level))].id)

function getFeedback(secret, guess) {
  let exact = 0
  const remainingSecret = {}
  const remainingGuess = {}
  secret.forEach((color, i) => {
    if (color === guess[i]) exact += 1
    else { remainingSecret[color] = (remainingSecret[color] || 0) + 1; remainingGuess[guess[i]] = (remainingGuess[guess[i]] || 0) + 1 }
  })
  const misplaced = Object.keys(remainingGuess).reduce((sum, color) => sum + Math.min(remainingGuess[color], remainingSecret[color] || 0), 0)
  return { exact, misplaced, absent: secret.length - exact - misplaced }
}

function MastermindGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [started, setStarted] = useState(false)
  const [secret, setSecret] = useState(() => randomCode(1))
  const [guess, setGuess] = useState(() => Array(lengthFor(1)).fill(null))
  const [activeSlot, setActiveSlot] = useState(0)
  const [history, setHistory] = useState([])
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [score, setScore] = useState(0)
  const [solved, setSolved] = useState(0)
  const [failed, setFailed] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [phase, setPhase] = useState('tutorial')
  const [attemptsThisCode, setAttemptsThisCode] = useState(0)
  const [complete, setComplete] = useState(false)
  const length = lengthFor(level)
  const palette = COLORS.slice(0, paletteFor(level))

  useEffect(() => {
    if (!started || complete || phase !== 'playing') return undefined
    const timer = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, complete, phase, level])

  function placeColor(colorId) {
    if (phase !== 'playing') return
    const next = [...guess]; next[activeSlot] = colorId; setGuess(next)
    const nextSlot = next.findIndex(color => color === null)
    setActiveSlot(nextSlot < 0 ? (activeSlot + 1) % length : nextSlot)
  }
  function submit(event) {
    event.preventDefault()
    if (phase !== 'playing' || guess.some(color => color === null)) return
    const result = getFeedback(secret, guess)
    const attempts = attemptsThisCode + 1
    setHistory(rows => [...rows, { guess, ...result }]); setAttemptsThisCode(attempts)
    if (result.exact === length) {
      setPhase('solved'); setSolved(n => n + 1); setTotalSeconds(s => s + seconds)
      setScore(s => s + Math.max(100, 1000 - attempts * 85 - seconds * 5))
    } else {
      setMistakes(n => n + 1)
      if (attempts >= MAX_GUESSES) { setPhase('failed'); setFailed(n => n + 1); setTotalSeconds(s => s + seconds) }
      else { setGuess(Array(length).fill(null)); setActiveSlot(0) }
    }
  }
  function begin() { setStarted(true); setPhase('playing') }
  function retryLevel() {
    setSecret(randomCode(level)); setGuess(Array(length).fill(null)); setActiveSlot(0); setHistory([]); setAttemptsThisCode(0); setSeconds(0); setPhase('playing')
  }
  function nextLevel() {
    if (level === TOTAL_LEVELS) { setComplete(true); return }
    const next = level + 1
    setLevel(next); setSecret(randomCode(next)); setGuess(Array(lengthFor(next)).fill(null)); setActiveSlot(0); setHistory([]); setAttemptsThisCode(0); setSeconds(0); setPhase('playing')
  }
  function replay() {
    setLevel(1); setStarted(false); setSecret(randomCode(1)); setGuess(Array(lengthFor(1)).fill(null)); setActiveSlot(0); setHistory([]); setSeconds(0); setTotalSeconds(0); setScore(0); setSolved(0); setFailed(0); setMistakes(0); setAttemptsThisCode(0); setPhase('tutorial'); setComplete(false)
  }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Çözülen kod<strong>{solved}/{TOTAL_LEVELS}</strong></span><span>Yanlış tahmin<strong>{mistakes}</strong></span><span>Başarısız level<strong>{failed}</strong></span><span>Süre<strong>{totalSeconds} sn</strong></span></div>

  return <GameShell title="Mastermind Logic" category="Logic" score={score} accuracy={ solved + failed > 0 ? solved / (solved + failed) * 100 : null } currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${seconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {!started ? <section className="game-tutorial"><p className="eyebrow">GÖREV BRİFİNGİ · LEVEL {level}</p><h2>Gizli renk dizisini bul</h2><p>Amacın {length} konumlu şifreyi çözmek. Renkler tekrar edebilir. Her tahminden sonra doğru konumdaki renkleri, doğru renk ama yanlış konumdakileri ve şifrede hiç olmayanları ayrı ayrı göreceksin.</p><button className="primary-button" type="button" onClick={begin}>Başla</button></section> : phase === 'solved' || phase === 'failed' ? <section className={`level-success ${phase === 'failed' ? 'wrong' : ''}`}><h2>{phase === 'solved' ? 'Şifre kırıldı!' : 'Tahmin hakkı bitti'}</h2><p>{phase === 'solved' ? `${attemptsThisCode} tahminde, ${seconds} saniyede çözdün.` : `Gizli kod: ${secret.map(id => palette.find(color => color.id === id)?.name).join(' · ')}`}</p>{phase === 'solved' ? <button className="primary-button" type="button" onClick={nextLevel}>{level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level'}</button> : <button className="primary-button" type="button" onClick={retryLevel}>Tekrar Dene</button>}</section> : <div className="mastermind-game">
      <p className="new-game-prompt">Level {level} · {length} konum · {MAX_GUESSES - attemptsThisCode} tahmin kaldı</p>
      <p className="new-game-hint">● doğru renk ve konum · ○ doğru renk, yanlış konum · — şifrede yok</p>
      <div className="mastermind-history">{history.map((row, i) => <div className="mastermind-row" key={`guess-${i}`}><div className="mastermind-guess">{row.guess.map((id, j) => <span key={`${id}-${j}`} style={{ background: COLORS.find(color => color.id === id).value }} />)}</div><span className="mastermind-clue">{row.exact} doğru yerde · {row.misplaced} doğru renk, yanlış yerde · {row.absent} bulunmuyor</span></div>)}</div>
      <form onSubmit={submit}><div className="mastermind-guess active">{guess.map((id, i) => <button type="button" className={activeSlot === i ? 'active-slot' : ''} key={`slot-${i}`} onClick={() => setActiveSlot(i)} aria-label={`Kod konumu ${i + 1}`}>{id ? <span style={{ background: COLORS.find(color => color.id === id).value }} /> : '·'}</button>)}</div><div className="mastermind-palette">{palette.map(color => <button type="button" key={color.id} title={color.name} aria-label={color.name} style={{ background: color.value }} onClick={() => placeColor(color.id)} />)}</div><button className="primary-button math-submit" type="submit" disabled={guess.some(color => color === null)}>Tahmini gönder</button></form>
    </div>}
  </GameShell>
}

export default MastermindGame
