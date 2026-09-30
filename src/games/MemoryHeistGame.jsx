import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'

const TOTAL_LEVELS = 9
const sizeFor = level => level === 1 ? 5 : level === 2 ? 6 : level <= 4 ? 7 : level <= 6 ? 8 : 9
const timeFor = level => Math.max(30, 90 - (level - 1) * 7)
const shuffle = values => {
  const items = [...values]
  for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]] }
  return items
}

function createMap(level) {
  const size = sizeFor(level)
  const path = [0]
  let row = 0
  let col = 0
  while (row < size - 1 || col < size - 1) {
    const moves = []
    if (row < size - 1) moves.push([1, 0])
    if (col < size - 1) moves.push([0, 1])
    const [dy, dx] = moves[Math.floor(Math.random() * moves.length)]
    row += dy; col += dx; path.push(row * size + col)
  }
  const route = new Set(path)
  const keyCount = level >= 3 ? 2 : 1
  const keys = Array.from({ length: keyCount }, (_, i) => path[2 + i * 2])
  const doors = Array.from({ length: keyCount }, (_, i) => path[3 + i * 2])
  const offPath = Array.from({ length: size * size }, (_, i) => i).filter(i => !route.has(i))
  const walls = new Set(offPath.filter(() => Math.random() < Math.min(0.24, 0.1 + level * 0.015)))
  const freeBranches = offPath.filter(cell => !walls.has(cell) && path.some(routeCell => Math.abs(Math.floor(routeCell / size) - Math.floor(cell / size)) + Math.abs(routeCell % size - cell % size) === 1))
  const specials = shuffle(freeBranches)
  const cameraCount = level >= 6 ? 2 : level >= 2 ? 1 : 0
  const cameras = specials.splice(0, cameraCount)
  const guard = level >= 6 ? (specials.shift() ?? -1) : -1
  const trap = level >= 4 ? (specials.shift() ?? -1) : -1
  const bonus = level >= 2 ? (specials.shift() ?? -1) : -1
  const safe = level >= 4 ? path[Math.max(4, path.length - 4)] : -1
  const guardPatrol = guard < 0 ? [] : [guard, ...shuffle(freeBranches.filter(cell => Math.abs(Math.floor(cell / size) - Math.floor(guard / size)) + Math.abs(cell % size - guard % size) === 1)).slice(0, 2)]
  return { size, path, start: 0, exit: path.at(-1), keys, doors, walls, cameras, guard, guardPatrol, trap, bonus, safe }
}

const missionFor = level => [
  'Anahtarı topla ve çıkışa ulaş.',
  'Kameranın görüşüne yakalanmadan anahtarı al ve çık.',
  'İki anahtarı ve iki kapıyı sırayla geç.',
  'Kasadaki belgeyi al, sonra çıkışa ulaş.',
  'Alarm aktif: süre dolmadan çıkışı bul.',
  'İki kamera ve devriye gezen korumadan kaç.',
  'Büyük binada görevleri tamamla; bonus riskini değerlendir.',
  'Dokuz kareli kanatta anahtarları bul ve çık.',
  'Son soygun: görevleri bitir ve alarmdan önce kaç.',
][level - 1]

function MemoryHeistGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [map, setMap] = useState(() => createMap(1))
  const [phase, setPhase] = useState('memorize')
  const [countdown, setCountdown] = useState(3)
  const [position, setPosition] = useState(0)
  const [keys, setKeys] = useState([])
  const [safeCollected, setSafeCollected] = useState(false)
  const [guardStep, setGuardStep] = useState(0)
  const [moves, setMoves] = useState(0)
  const [levelSeconds, setLevelSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeFor(1))
  const [timeTotal, setTimeTotal] = useState(0)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [caught, setCaught] = useState(0)
  const [bonusTotal, setBonusTotal] = useState(0)
  const [levelBonus, setLevelBonus] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [eventPoints, setEventPoints] = useState(null)
  const [complete, setComplete] = useState(false)
  const [shake, setShake] = useState(false)
  const revealSeconds = Math.max(3, 9 - level)
  const collected = useMemo(() => new Set(keys), [keys])

  useEffect(() => {
    if (phase !== 'memorize' || complete) return undefined
    const timer = window.setTimeout(() => { setCountdown(3); setPhase('countdown') }, revealSeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, revealSeconds, complete])
  useEffect(() => {
    if (phase !== 'countdown') return undefined
    const timer = window.setInterval(() => setCountdown(value => {
      if (value <= 1) { window.clearInterval(timer); setPhase('go'); return 'GO' }
      return value - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [phase])
  useEffect(() => {
    if (phase !== 'go') return undefined
    const timer = window.setTimeout(() => setPhase('heist'), 500)
    return () => window.clearTimeout(timer)
  }, [phase])
  useEffect(() => {
    if (phase !== 'heist') return undefined
    const timer = window.setInterval(() => {
      setLevelSeconds(value => value + 1)
      setTimeLeft(value => {
        if (value <= 1) { setPhase('explosion'); setFeedback('ALARM! Süre doldu.'); setErrors(count => count + 1); return 0 }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, level])
  useEffect(() => {
    if (phase !== 'explosion') return undefined
    playSfx('explosion')
    const timer = window.setTimeout(() => { setCaught(value => value + 1); setPhase('failed') }, 1000)
    return () => window.clearTimeout(timer)
  }, [phase])
  useEffect(() => { if (phase === 'failed') playSfx('gameOver'); else if (phase === 'success') playSfx('levelComplete') }, [phase])
  useEffect(() => { if (phase === 'countdown') playSfx('countdown') }, [countdown, phase])
  useEffect(() => {
    if (!shake) return undefined
    const timer = window.setTimeout(() => setShake(false), 400)
    return () => window.clearTimeout(timer)
  }, [shake])

  const fail = useCallback(message => {
    playSfx('warning'); setFeedback(message); setShake(true); setErrors(value => value + 1); setPhase('explosion')
  }, [])
  const movePlayer = useCallback((dy, dx) => {
    if (phase !== 'heist') return
    const r = Math.floor(position / map.size) + dy
    const c = position % map.size + dx
    if (r < 0 || r >= map.size || c < 0 || c >= map.size) return
    const next = r * map.size + c
    if (map.walls.has(next)) { setErrors(value => value + 1); setFeedback('Duvar yolu kapatıyor.'); setShake(true); return }
    if (map.doors.includes(next) && keys.length < map.doors.indexOf(next) + 1) { setFeedback('Kapı kilitli · önce anahtarı bul.'); setErrors(value => value + 1); setShake(true); return }
    if (next === map.trap) { fail('GİZLİ TUZAK!'); return }
    if (map.cameras.includes(next)) { fail('KAMERA ALARMI!'); return }
    const nextGuardStep = map.guardPatrol.length ? (guardStep + 1) % map.guardPatrol.length : 0
    if (map.guardPatrol[nextGuardStep] === next || map.guard === next) { fail('KORUMA SENİ YAKALADI!'); return }
    const cameraWatching = map.cameras.some((camera, i) => {
      const facing = (moves + i) % 4
      const offsets = [[0, 1], [1, 0], [0, -1], [-1, 0]][facing]
      return camera + offsets[0] * map.size + offsets[1] === next
    })
    if (cameraWatching) { fail('KAMERANIN GÖRÜŞÜNE GİRDİN!'); return }
    setPosition(next); setMoves(value => value + 1); setGuardStep(nextGuardStep); setFeedback(''); setEventPoints(null)
    if (map.keys.includes(next) && !collected.has(next)) { setKeys(old => [...old, next]); setFeedback('ANAHTAR ALINDI'); setEventPoints(100) }
    if (next === map.safe && !safeCollected) { setSafeCollected(true); setFeedback('KASA AÇILDI · BELGE ALINDI'); setEventPoints(250) }
    if (next === map.bonus) { setBonusTotal(value => value + 300); setLevelBonus(value => value + 300); setScore(value => value + 300); setFeedback('BONUS · RİSK ALINDI'); setEventPoints(300) }
    const gotAllKeys = map.keys.every(key => collected.has(key) || key === next)
    if (next === map.exit && gotAllKeys && (map.safe < 0 || safeCollected || map.safe === next)) {
      const points = Math.max(100, 1200 - levelSeconds * 7 - errors * 35 + levelBonus)
      setScore(value => value + points); setEventPoints(points); setBestScore(value => Math.max(value, score + points)); setTimeTotal(value => value + levelSeconds); setPhase('success'); setFeedback('LEVEL COMPLETE')
    } else if (next === map.exit) setFeedback('Görev öğelerini tamamla ve sonra çıkışa git.')
  }, [phase, position, map, keys, collected, guardStep, moves, safeCollected, levelSeconds, errors, levelBonus, score, fail])

  useEffect(() => {
    if (phase !== 'heist') return undefined
    const onKey = event => {
      const move = { ArrowUp: [-1, 0], w: [-1, 0], ArrowDown: [1, 0], s: [1, 0], ArrowLeft: [0, -1], a: [0, -1], ArrowRight: [0, 1], d: [0, 1] }[event.key]
      if (!move) return
      event.preventDefault(); movePlayer(move[0], move[1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, movePlayer])

  function setup(nextLevel) {
    setLevel(nextLevel); setMap(createMap(nextLevel)); setPhase('memorize'); setCountdown(3); setPosition(0); setKeys([]); setSafeCollected(false); setGuardStep(0); setMoves(0); setLevelBonus(0); setLevelSeconds(0); setTimeLeft(timeFor(nextLevel)); setFeedback('')
  }
  function nextLevel() { if (level === TOTAL_LEVELS) { setComplete(true); return } setup(level + 1) }
  function retry() { setup(level) }
  function replay() { setScore(0); setBestScore(0); setErrors(0); setCaught(0); setBonusTotal(0); setTimeTotal(0); setComplete(false); setup(1) }
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Best<strong>{bestScore}</strong></span><span>Tamamlanan level<strong>{level}/{TOTAL_LEVELS}</strong></span><span>Hata<strong>{errors}</strong></span><span>Yakalanma<strong>{caught}</strong></span><span>Bonus<strong>+{bonusTotal}</strong></span><span>Süre<strong>{timeTotal} sn</strong></span></div>
  const cells = Array.from({ length: map.size * map.size }, (_, i) => i)
  const visible = phase === 'memorize'
  return <GameShell title="Memory Heist" category="Memory" score={score} currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={phase === 'memorize' ? 'MEMORIZE' : phase === 'countdown' || phase === 'go' ? String(countdown) : `${timeLeft}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase === 'failed' || phase === 'success' ? <section className={`level-success ${phase === 'failed' ? 'game-failure' : 'heist-clear'}`}><p className="eyebrow">{phase === 'success' ? 'LEVEL COMPLETE' : 'MISSION FAILED'}</p><h2>{phase === 'success' ? 'Soygun tamamlandı!' : feedback}</h2><p>{levelSeconds}s · {moves} hamle · {errors} hata · bonus +{bonusTotal}</p><button className="primary-button" type="button" onClick={phase === 'success' ? nextLevel : retry}>{phase === 'success' ? level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level' : 'Tekrar Dene'}</button></section> : <div className={`heist-game ${shake ? 'screen-shake' : ''} ${phase === 'explosion' ? 'explosion-flash' : ''}`}>
      <p className="new-game-prompt">{phase === 'memorize' ? `MEMORIZE · ${revealSeconds} saniye` : phase === 'countdown' || phase === 'go' ? 'HAZIRLAN' : 'HEIST · ' + missionFor(level)}</p>
      {phase === 'heist' && level >= 2 && <p className="new-game-hint">Kameralar her hamlede saat yönünde döner · okların baktığı karelerden uzak dur.</p>}
      <div className={`heist-scene ${phase}`}><div className="heist-grid" style={{ '--grid-size': map.size }}>{cells.map(cell => {
        const wall = map.walls.has(cell)
        const guardHere = map.guardPatrol.length && map.guardPatrol[guardStep] === cell
        let glyph = ''
        if (cell === position) glyph = '🕵'
        else if (wall) glyph = '▰'
        else if (visible && cell === map.start) glyph = 'START'
        else if (visible && cell === map.exit) glyph = 'EXIT'
        else if (visible && map.keys.includes(cell)) glyph = '🔑'
        else if (visible && map.doors.includes(cell)) glyph = '🚪'
        else if (map.cameras.includes(cell)) glyph = visible ? '◉' : ['→', '↓', '←', '↑'][(moves + map.cameras.indexOf(cell)) % 4]
        else if (visible && cell === map.guard) glyph = '👮'
        else if (visible && cell === map.trap) glyph = '⚠'
        else if (visible && cell === map.safe) glyph = '▣'
        else if (visible && cell === map.bonus) glyph = '✦'
        else if (guardHere) glyph = '👮'
        const classes = ['heist-cell', wall ? 'wall' : '', map.doors.includes(cell) && !visible ? 'hidden-door' : '', map.cameras.includes(cell) ? 'camera-active' : '', guardHere ? 'guard-active' : '', cell === position ? 'player' : ''].filter(Boolean).join(' ')
        return <button type="button" key={cell} className={classes} disabled={phase !== 'heist' || wall} onClick={() => { const dr = Math.floor(cell / map.size) - Math.floor(position / map.size); const dc = cell % map.size - position % map.size; if (Math.abs(dr) + Math.abs(dc) === 1) movePlayer(dr, dc) }} aria-label={visible ? `Hücre ${cell + 1} ${glyph}` : `Hücre ${cell + 1}`}>{glyph}</button>
      })}</div>{(phase === 'countdown' || phase === 'go') && <div className="heist-countdown">{countdown}</div>}{phase === 'explosion' && <div className="heist-explosion">MISSION FAILED</div>}</div>
      {phase === 'heist' && <div className="heist-controls"><button onClick={() => movePlayer(-1, 0)}>↑</button><button onClick={() => movePlayer(0, -1)}>←</button><button onClick={() => movePlayer(1, 0)}>↓</button><button onClick={() => movePlayer(0, 1)}>→</button></div>}
      <div className="heist-objectives"><span>KEY {keys.length}/{map.keys.length}</span>{map.safe >= 0 && <span>SAFE {safeCollected ? 'OPEN' : 'LOCKED'}</span>}<span>EXIT {position === map.exit ? 'REACHED' : '—'}</span><span>ALARM {timeLeft}s</span></div>
      <GameFeedback type={feedback.includes('ALARM') || feedback.includes('YAKALADI') || feedback.includes('TUZAK') || feedback.includes('GÖRÜŞÜ') ? 'wrong' : feedback ? 'correct' : 'neutral'} points={eventPoints}>{feedback || missionFor(level)}</GameFeedback>
    </div>}
  </GameShell>
}

export default MemoryHeistGame
