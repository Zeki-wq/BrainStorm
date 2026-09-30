import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_LEVELS = 5
const TARGET = 2
const diskCount = level => level + 2
const initialTowers = count => [Array.from({ length: count }, (_, i) => count - i), [], []]

function TowerOfHanoiGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [started, setStarted] = useState(false)
  const [towers, setTowers] = useState(() => initialTowers(3))
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [errors, setErrors] = useState(0)
  const [levelErrors, setLevelErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [levelSeconds, setLevelSeconds] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [moveError, setMoveError] = useState('')
  const [totalMoves, setTotalMoves] = useState(0)
  const [optimalTotal, setOptimalTotal] = useState(0)
  const [timeTotal, setTimeTotal] = useState(0)
  const [complete, setComplete] = useState(false)
  const count = diskCount(level)
  const optimal = (2 ** count) - 1

  useEffect(() => { if (moves > 0) playSfx('movement') }, [moves])

  useEffect(() => {
    if (!started || complete || feedback === 'solved') return undefined
    const timer = window.setInterval(() => setLevelSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, complete, feedback, level])

  function choosePeg(index) {
    if (!started || feedback || complete) return
    if (selected === null) {
      if (!towers[index].length) { setErrors(value => value + 1); setLevelErrors(value => value + 1); setMoveError('Bu çubukta taşınacak disk yok.'); return }
      setSelected(index); setMoveError(''); return
    }
    if (selected === index) { setSelected(null); return }
    const from = towers[selected]
    const to = towers[index]
    const disk = from[from.length - 1]
    const top = to[to.length - 1]
    if (top && top < disk) { setErrors(n => n + 1); setLevelErrors(n => n + 1); setSelected(null); setMoveError('Geçersiz hamle: büyük disk küçük diskin üzerine gelemez.'); return }
    const next = towers.map(peg => [...peg]); next[selected].pop(); next[index].push(disk)
    const nextMoves = moves + 1
    setTowers(next); setMoves(nextMoves); setSelected(null); setMoveError('')
    if (next[TARGET].length === count) {
      const earned = Math.max(0, 1200 - Math.max(0, nextMoves - optimal) * 45 - levelSeconds * 3 - levelErrors * 20)
      setScore(s => s + earned); setTotalMoves(s => s + nextMoves); setOptimalTotal(s => s + optimal); setTimeTotal(s => s + levelSeconds); setFeedback('solved')
    }
  }
  function begin() { setStarted(true) }
  function nextLevel() {
    const next = level + 1
    setLevel(next); setTowers(initialTowers(diskCount(next))); setSelected(null); setMoves(0); setLevelErrors(0); setLevelSeconds(0); setMoveError(''); setFeedback('')
  }
  function replay() {
    setLevel(1); setStarted(false); setTowers(initialTowers(3)); setSelected(null); setMoves(0); setErrors(0); setLevelErrors(0); setScore(0); setLevelSeconds(0); setFeedback(''); setMoveError(''); setTotalMoves(0); setOptimalTotal(0); setTimeTotal(0); setComplete(false)
  }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Toplam hamle<strong>{totalMoves}</strong></span><span>Optimal<strong>{optimalTotal}</strong></span><span>Hata<strong>{errors}</strong></span><span>Süre<strong>{timeTotal} sn</strong></span></div>

  return <GameShell title="Tower of Hanoi" category="Problem Solving" score={score} currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${levelSeconds}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {!started ? <section className="game-tutorial"><p className="eyebrow">GÖREV BRİFİNGİ · LEVEL {level}</p><h2>Amaç</h2><p>Tüm diskleri A çubuğundan B çubuğuna taşı. Aynı anda yalnızca bir disk hareket eder; büyük disk küçük diskin üzerine gelemez. En az hamleyle bitirmeye çalış.</p><p><strong>A: Kaynak</strong> · <strong>C: Yardımcı</strong> · <strong>B: Hedef</strong></p><button className="primary-button" type="button" onClick={begin}>Başla</button></section> : feedback === 'solved' ? <section className="level-success"><h2>Level {level} tamamlandı!</h2><p>Optimal: {optimal} hamle · Senin hamlelerin: {moves} · {levelSeconds} sn · {levelErrors} hata</p><button className="primary-button" type="button" onClick={level === TOTAL_LEVELS ? () => setComplete(true) : nextLevel}>{level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'NEXT LEVEL'}</button></section> : <div className={`hanoi-game ${moveError ? 'screen-shake' : ''}`}>
      <p className="new-game-prompt">Level {level} · {count} disk · hedef çubuk B</p>
      <div className="hanoi-pegs">{towers.map((tower, index) => <button className={`hanoi-peg${selected === index ? ' selected' : ''}`} type="button" key={index} onClick={() => choosePeg(index)} aria-label={`Çubuk ${['A', 'C', 'B'][index]}`}><span className="hanoi-rod"/><span className="hanoi-disk-stack">{tower.map(disk => <span className="hanoi-disk" key={disk} style={{ '--disk-width': `${34 + disk * 8}%`, '--disk-hue': 255 - disk * 18 }}>{disk}</span>)}</span><span className="hanoi-base"/><span className="hanoi-peg-label">{['A', 'C', 'B'][index]}</span></button>)}</div>
      <p className="path-status">Hamle {moves} / minimum {optimal} · {count} disk</p><p className={`game-feedback ${moveError ? 'wrong' : ''}`} aria-live="polite">{moveError || (selected !== null ? 'Şimdi hedef çubuğu B seç.' : 'Önce kaynak çubuğu seç.')}</p>
    </div>}
  </GameShell>
}

export default TowerOfHanoiGame
