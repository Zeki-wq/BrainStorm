import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_LEVELS = 10
const shuffle = values => { const next = [...values]; for (let i = next.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]] } return next }
const sizeFor = level => level <= 2 ? 3 : level <= 5 ? 4 : level <= 8 ? 5 : 6
const targetsFor = level => Math.min(sizeFor(level) ** 2 - 3, 2 + Math.ceil(level * 0.8))
const revealFor = level => Math.max(650, 1800 - level * 110)
function makeLevel(level) { const size = sizeFor(level); return { size, targets: shuffle(Array.from({ length: size ** 2 }, (_, i) => i)).slice(0, targetsFor(level)) } }

function MemoryMatrixGame({ onBack }) {
  const [level, setLevel] = useState(1); const [board, setBoard] = useState(() => makeLevel(1)); const [phase, setPhase] = useState('showing'); const [selected, setSelected] = useState([]); const [correct, setCorrect] = useState(0); const [errors, setErrors] = useState(0); const [score, setScore] = useState(0); const [combo, setCombo] = useState(0); const [feedback, setFeedback] = useState(''); const [complete, setComplete] = useState(false)
  useEffect(() => { if (phase !== 'showing') return undefined; const timer = window.setTimeout(() => { setPhase('selecting'); setFeedback('Vurgulanan hücreleri seç, ardından kontrol et.') }, revealFor(level)); return () => window.clearTimeout(timer) }, [phase, level])
  function choose(index) { if (phase !== 'selecting') return; setSelected(value => value.includes(index) ? value.filter(item => item !== index) : [...value, index]) }
  function check() {
    if (phase !== 'selecting') return
    const right = selected.length === board.targets.length && selected.every(index => board.targets.includes(index))
    if (right) { const chain = combo + 1; const multiplier = chain >= 5 ? 3 : chain >= 3 ? 2 : 1; setCorrect(value => value + 1); setCombo(chain); setScore(value => value + (160 + board.targets.length * 35) * multiplier); setFeedback(`Doğru matris! Combo x${multiplier}`); setPhase('cleared'); playSfx(chain >= 3 ? 'combo' : 'correct') }
    else { setErrors(value => value + 1); setCombo(0); setScore(value => Math.max(0, value - 45)); setFeedback('Hücreler eşleşmedi. Aynı leveli tekrar dene.'); setPhase('failed'); playSfx('wrong') }
  }
  function setup(nextLevel) { setLevel(nextLevel); setBoard(makeLevel(nextLevel)); setSelected([]); setFeedback(''); setPhase('showing') }
  function replay() { setCorrect(0); setErrors(0); setScore(0); setCombo(0); setComplete(false); setup(1) }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Tamamlanan level<strong>{correct}/{TOTAL_LEVELS}</strong></span><span>Hata<strong>{errors}</strong></span><span>En büyük grid<strong>{sizeFor(Math.min(TOTAL_LEVELS, level))}x{sizeFor(Math.min(TOTAL_LEVELS, level))}</strong></span></div>
  const gridStyle = { display: 'grid', gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`, gap: 'clamp(8px, 1.5vw, 14px)', width: 'min(92vw, 540px)', margin: '0 auto', aspectRatio: '1' }
  return <GameShell title="Memory Matrix" category="Hafıza" score={score} accuracy={correct + errors ? correct / (correct + errors) * 100 : null} currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase === 'cleared' || phase === 'failed' ? <section className={`level-success ${phase === 'failed' ? 'game-failure' : ''}`}><h2>{phase === 'cleared' ? `Level ${level} tamamlandı` : 'Tekrar dene'}</h2><p>{board.size}x{board.size} grid · {board.targets.length} hücre · {feedback}</p><button className="primary-button" type="button" onClick={phase === 'failed' ? () => setup(level) : level === TOTAL_LEVELS ? () => setComplete(true) : () => setup(level + 1)}>{phase === 'failed' ? 'Leveli Yenile' : level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level'}</button></section> : <div className="matrix-memory-game"><p className="new-game-prompt">Level {level} · {phase === 'showing' ? 'Parlayan hücreleri ezberle' : 'Hatırladığın hücreleri işaretle'}</p><div className="memory-matrix-grid" style={gridStyle}>{Array.from({ length: board.size ** 2 }, (_, index) => <button className={`matrix-memory-cell${phase === 'showing' && board.targets.includes(index) ? ' lit' : ''}${selected.includes(index) ? ' selected' : ''}`} style={{ minWidth: 0, minHeight: 0 }} key={`${level}-${index}`} type="button" onClick={() => choose(index)} disabled={phase !== 'selecting'} aria-pressed={selected.includes(index)} aria-label={`Hücre ${index + 1}`} />)}</div>{phase === 'selecting' && <button className="primary-button" type="button" style={{ display: 'block', margin: '18px auto 0' }} onClick={check} disabled={selected.length !== board.targets.length}>Seçimi Kontrol Et</button>}<GameFeedback type="neutral" combo={combo >= 3 ? combo >= 5 ? 3 : 2 : null}>{feedback || `${board.targets.length} hücre · gösterim ${Math.round(revealFor(level) / 100) / 10}s`}</GameFeedback></div>}
  </GameShell>
}
export default MemoryMatrixGame
