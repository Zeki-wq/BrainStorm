import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'
import { playSfx } from '../utils/audioManager.js'
import './courierRush.css'

const TOTAL_LEVELS = 10
const sizeFor = level => level <= 2 ? 6 : level <= 5 ? 7 : level <= 8 ? 8 : 9
const deliveriesFor = level => Math.min(2 + Math.floor((level - 1) / 2), 6)
const shuffle = values => {
  const items = [...values]
  for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]] }
  return items
}

function buildCity(level) {
  const size = sizeFor(level)
  const route = [0]
  let row = 0
  let col = 0
  while (row < size - 1 || col < size - 1) {
    const directions = []
    if (row < size - 1) directions.push([1, 0])
    if (col < size - 1) directions.push([0, 1])
    const [dy, dx] = directions[Math.floor(Math.random() * directions.length)]
    row += dy; col += dx; route.push(row * size + col)
  }
  const routeSet = new Set(route)
  const reserved = new Set([0, route.at(-1)])
  const deliveryCells = shuffle(route.slice(2, -2)).slice(0, deliveriesFor(level))
  deliveryCells.forEach(cell => reserved.add(cell))
  const cells = Array.from({ length: size * size }, (_, i) => i)
  const sideStreets = shuffle(cells.filter(cell => !routeSet.has(cell) && route.some(road => Math.abs(Math.floor(road / size) - Math.floor(cell / size)) + Math.abs(road % size - cell % size) === 1)))
  const blockedCount = Math.min(sideStreets.length, Math.floor(level / 2) + 1)
  const blocked = new Set(sideStreets.splice(0, blockedCount))
  const available = sideStreets.filter(cell => !reserved.has(cell) && !blocked.has(cell))
  const shortcut = level >= 2 ? available.pop() ?? -1 : -1
  const bonus = level >= 3 ? available.pop() ?? -1 : -1
  const powerup = level >= 4 ? available.pop() ?? -1 : -1
  const traps = new Set(level >= 5 ? available.splice(0, Math.min(1 + Math.floor((level - 5) / 2), 4)) : [])
  const trapClues = new Set([...traps].flatMap(cell => [cell - size, cell + size, cell - 1, cell + 1].filter(next => next >= 0 && next < size * size && Math.abs(Math.floor(next / size) - Math.floor(cell / size)) + Math.abs(next % size - cell % size) === 1)))
  return {
    size, route, routeSet, blocked, deliveryCells, finish: route.at(-1), shortcut, bonus, powerup, traps, trapClues,
    fuel: route.length + 7 + level * 2,
    seconds: Math.max(34, 80 - level * 4),
  }
}

function CourierRushGame({ onBack }) {
  const [level, setLevel] = useState(1)
  const [city, setCity] = useState(() => buildCity(1))
  const [player, setPlayer] = useState(0)
  const [delivered, setDelivered] = useState([])
  const [collectedBonuses, setCollectedBonuses] = useState([])
  const [powerupCollected, setPowerupCollected] = useState(false)
  const [fuel, setFuel] = useState(city.fuel)
  const [timeLeft, setTimeLeft] = useState(city.seconds)
  const [elapsed, setElapsed] = useState(0)
  const [traffic, setTraffic] = useState(-1)
  const [closedRoad, setClosedRoad] = useState(-1)
  const [eventPackage, setEventPackage] = useState(-1)
  const [eventShortcut, setEventShortcut] = useState(-1)
  const [eventLabel, setEventLabel] = useState('')
  const [eventKind, setEventKind] = useState('')
  const [powerups, setPowerups] = useState({ boost: 1, scan: 1, shield: 0 })
  const [shieldActive, setShieldActive] = useState(false)
  const [mapScanned, setMapScanned] = useState(false)
  const [streak, setStreak] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0)
  const [bonusCount, setBonusCount] = useState(0)
  const [phase, setPhase] = useState('playing')
  const [feedback, setFeedback] = useState('')
  const [complete, setComplete] = useState(false)
  const playerRef = useRef(player)
  const scannedTimer = useRef(null)
  const deliveredSet = useMemo(() => new Set(delivered), [delivered])
  const missionSize = city.deliveryCells.length

  useEffect(() => { playerRef.current = player }, [player])
  useEffect(() => {
    if (phase !== 'playing') return undefined
    const timer = window.setTimeout(() => {
      setElapsed(value => value + 1)
      if (timeLeft <= 1) { setTimeLeft(0); setPhase('failed'); setFeedback('Teslimat saati doldu.') }
      else setTimeLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [phase, timeLeft, level])

  useEffect(() => {
    if (phase !== 'playing' || level < 3) return undefined
    const interval = window.setInterval(() => {
      const candidates = Array.from({ length: city.size * city.size }, (_, cell) => cell)
        .filter(cell => cell !== playerRef.current && !city.blocked.has(cell) && !city.deliveryCells.includes(cell) && cell !== city.finish && !city.traps.has(cell))
      if (!candidates.length) return
      const cell = candidates[Math.floor(Math.random() * candidates.length)]
      const roll = Math.random()
      if (roll < 0.38) { setTraffic(cell); setClosedRoad(-1); setEventKind('traffic'); setEventLabel('TRAFİK AKIŞI · Bu kareye girersen 3 saniye kaybedersin.'); playSfx('traffic') }
      else if (roll < 0.65 && !city.routeSet.has(cell)) { setClosedRoad(cell); setTraffic(-1); setEventKind('closure'); setEventLabel('YOL KAPANDI · Alternatif sokağı kullan.') }
      else if (roll < 0.82) { setEventShortcut(cell); setEventKind('shortcut'); setEventLabel('KISAYOL AÇILDI · Mavi portal enerji kazandırır.') }
      else { setEventPackage(cell); setEventKind('bonus'); setEventLabel('ÖNCELİKLİ PAKET · Altın kare +200 puan.') }
    }, Math.max(3200, 8500 - level * 450))
    return () => window.clearInterval(interval)
  }, [phase, level, city])

  useEffect(() => {
    if (!eventKind) return undefined
    const timer = window.setTimeout(() => { setTraffic(-1); setClosedRoad(-1); setEventPackage(-1); setEventShortcut(-1); setEventKind(''); setEventLabel('') }, 4500)
    return () => window.clearTimeout(timer)
  }, [eventKind])
  useEffect(() => () => window.clearTimeout(scannedTimer.current), [])
  useEffect(() => {
    if (phase !== 'warning') return undefined
    playSfx('warning')
    const timer = window.setTimeout(() => setPhase('explosion'), 700)
    return () => window.clearTimeout(timer)
  }, [phase])
  useEffect(() => {
    if (phase !== 'explosion') return undefined
    playSfx('explosion')
    const timer = window.setTimeout(() => setPhase('failed'), 650)
    return () => window.clearTimeout(timer)
  }, [phase])

  const move = useCallback((dy, dx) => {
    if (phase !== 'playing') return
    const row = Math.floor(player / city.size) + dy
    const col = player % city.size + dx
    if (row < 0 || row >= city.size || col < 0 || col >= city.size) return
    const next = row * city.size + col
    if (city.blocked.has(next) || next === closedRoad) { setErrors(value => value + 1); setStreak(0); setFeedback('Sokak kapalı. Rotanı yeniden değerlendir.'); playSfx('wrong'); return }
    const shortcutMove = next === city.shortcut || next === eventShortcut
    const fuelCost = shortcutMove ? 0 : 1
    if (fuel < fuelCost) { setPhase('failed'); setFeedback('Elektrikli bisikletin enerjisi bitti.'); playSfx('gameOver'); return }
    setPlayer(next); setFuel(value => value - fuelCost); setTotalDistance(value => value + 1); setFeedback('')
    playSfx('movement')
    let nextDelivered = delivered
    if (city.deliveryCells.includes(next) && !deliveredSet.has(next)) {
      nextDelivered = [...delivered, next]
      setDelivered(nextDelivered)
      const multiplier = streak >= 5 ? 3 : streak >= 2 ? 2 : 1
      setStreak(value => value + 1)
      setScore(value => value + 150 * multiplier)
      setFeedback(`PAKET TESLİM EDİLDİ · +${150 * multiplier} · COMBO x${multiplier}`)
      playSfx('delivery')
    }
    if (next === traffic) { setTimeLeft(value => Math.max(0, value - 3)); setErrors(value => value + 1); setStreak(0); setFeedback('Trafik sıkışıklığı · 3 saniye ve combo kaybedildi.'); playSfx('traffic') }
    if (shortcutMove) { setFuel(value => value + 4); setScore(value => value + 100); setFeedback('KISAYOL · +4 enerji · +100'); playSfx('pickup') }
    if ((next === city.bonus && !collectedBonuses.includes(next)) || next === eventPackage) { setCollectedBonuses(value => [...value, next]); setEventPackage(-1); setBonusCount(value => value + 1); setScore(value => value + 200); setFeedback('BONUS PAKET · +200'); playSfx('pickup') }
    if (next === city.powerup && !powerupCollected) { setPowerupCollected(true); setPowerups(value => ({ ...value, boost: value.boost + 1 })); setFeedback('GÜÇ DESTEĞİ ALINDI'); playSfx('pickup') }
    if (city.traps.has(next)) {
      if (shieldActive) { setShieldActive(false); setScore(value => Math.max(0, value - 100)); setFeedback('KALKAN TUZAĞI ENGELLEDİ · -100'); playSfx('wrong') }
      else { setErrors(value => value + 1); setStreak(0); setTimeLeft(value => Math.max(0, value - 8)); setScore(value => Math.max(0, value - 180)); setFeedback('WARNING · Arcade tuzağı · 8 saniye ceza'); setPhase('warning'); return }
    }
    if (next === city.finish) {
      if (nextDelivered.length < missionSize) { setFeedback('Garaja dönmeden önce bütün teslimatları tamamla.'); return }
      const reward = Math.max(0, 700 + timeLeft * 20 + fuel * 10 - errors * 45)
      setScore(value => value + reward); setPhase('success'); setFeedback(`VARDİYA TAMAMLANDI · +${reward}`); playSfx('levelComplete')
    }
  }, [phase, player, city, closedRoad, fuel, delivered, deliveredSet, streak, traffic, eventPackage, eventShortcut, shieldActive, missionSize, timeLeft, errors, collectedBonuses, powerupCollected])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const onKey = event => {
      const direction = { ArrowUp: [-1, 0], w: [-1, 0], ArrowDown: [1, 0], s: [1, 0], ArrowLeft: [0, -1], a: [0, -1], ArrowRight: [0, 1], d: [0, 1] }[event.key]
      if (direction) { event.preventDefault(); move(...direction) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, move])

  function setup(nextLevel) {
    const next = buildCity(nextLevel)
    setLevel(nextLevel); setCity(next); setPlayer(0); setDelivered([]); setCollectedBonuses([]); setPowerupCollected(false); setFuel(next.fuel); setTimeLeft(next.seconds); setElapsed(0)
    setTraffic(-1); setClosedRoad(-1); setEventPackage(-1); setEventShortcut(-1); setEventKind(''); setEventLabel(''); setMapScanned(false)
    setPowerups({ boost: nextLevel >= 4 ? 2 : 1, scan: nextLevel >= 2 ? 1 : 0, shield: nextLevel >= 6 ? 1 : 0 }); setShieldActive(false)
    setStreak(0); setFeedback(''); setPhase('playing')
  }
  function replay() { setErrors(0); setScore(0); setTotalDistance(0); setBonusCount(0); setComplete(false); setup(1) }
  function activatePowerup(kind) {
    if (phase !== 'playing' || powerups[kind] <= 0) return
    setPowerups(value => ({ ...value, [kind]: value[kind] - 1 }))
    if (kind === 'scan') {
      setMapScanned(true); window.clearTimeout(scannedTimer.current)
      scannedTimer.current = window.setTimeout(() => setMapScanned(false), 3500)
      setFeedback('MAP SCAN · tehlikeler kısa süre görünür.')
    } else if (kind === 'shield') { setShieldActive(true); setFeedback('SHIELD · bir tehlikeli sokağı güvenle geçebilirsin.') }
    else { setFuel(value => value + 5); setTimeLeft(value => value + 8); setFeedback('SPEED BOOST · +5 enerji · +8 saniye') }
  }

  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Teslimat<strong>{delivered.length}/{missionSize}</strong></span><span>Mesafe<strong>{totalDistance} kare</strong></span><span>Bonus<strong>{bonusCount}</strong></span><span>Hata<strong>{errors}</strong></span><span>Enerji<strong>{fuel}</strong></span></div>
  const cells = Array.from({ length: city.size * city.size }, (_, index) => index)
  const combo = streak >= 5 ? 3 : streak >= 2 ? 2 : 1
  return <GameShell title="Courier Rush" category="Problem Solving" score={score} accuracy={ delivered.length + errors > 0 ? delivered.length / (delivered.length + errors) * 100 : null } currentRound={complete ? TOTAL_LEVELS : level - 1} totalRounds={TOTAL_LEVELS} timeRemaining={`${timeLeft}s · ${fuel} enerji`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    {phase !== 'playing' ? <section className={`level-success ${phase === 'success' ? 'courier-clear' : 'game-failure'} ${phase === 'warning' || phase === 'explosion' ? 'courier-alarm' : ''}`}>
      <p className="eyebrow">{phase === 'success' ? 'DELIVERY COMPLETE' : phase === 'warning' ? 'WARNING' : phase === 'explosion' ? 'ARCADE ALERT' : 'SHIFT FAILED'}</p>
      {phase === 'explosion' ? <div className="courier-explosion">ROUTE INTERRUPTED</div> : null}
      {phase !== 'explosion' && <><h2>{phase === 'success' ? `Level ${level} delivered!` : phase === 'warning' ? 'Tehlikeli yol!' : feedback}</h2><p>{delivered.length}/{missionSize} paket · {elapsed} sn · enerji {fuel}</p>{phase !== 'warning' && <button className="primary-button" type="button" onClick={phase === 'success' ? level === TOTAL_LEVELS ? () => setComplete(true) : () => setup(level + 1) : () => setup(level)}>{phase === 'success' ? level === TOTAL_LEVELS ? 'Sonuçları Gör' : 'Sonraki Level' : 'Tekrar Dene'}</button>}</>}
    </section> : <div className="courier-game city-game">
      <div className="city-hud"><span>SHIFT {String(level).padStart(2, '0')}</span><strong>⏱ {timeLeft}s</strong><strong>⚡ {fuel}</strong><span>📦 {delivered.length}/{missionSize}</span><span>COMBO x{combo}</span></div>
      <p className="new-game-prompt">Paketleri teslim et, sonra garaja dön · Ok tuşları veya WASD</p>
      {eventLabel && <p className={`city-event ${eventKind === 'closure' ? 'wrong' : ''}`}>{eventLabel}</p>}
      <div className="city-grid" style={{ '--city-size': city.size }}>{cells.map(cell => {
        const isPlayer = cell === player
        const packageIndex = city.deliveryCells.indexOf(cell)
        const isTrap = city.traps.has(cell)
        const showClue = isTrap && (mapScanned || (level <= 6 && city.trapClues.has(cell)))
        const glyph = isPlayer ? '🚲' : city.blocked.has(cell) ? '◰' : packageIndex >= 0 && !deliveredSet.has(cell) ? `P${packageIndex + 1}` : cell === city.finish ? 'GAR' : cell === city.shortcut ? '↗' : cell === eventShortcut ? '⇢' : cell === eventPackage || (cell === city.bonus && !collectedBonuses.includes(cell)) ? '★' : cell === city.powerup && !powerupCollected ? '✚' : cell === traffic ? '🚦' : cell === closedRoad ? '×' : showClue ? '⚠' : ''
        const distance = Math.abs(Math.floor(cell / city.size) - Math.floor(player / city.size)) + Math.abs(cell % city.size - player % city.size)
        return <button type="button" key={cell} className={`city-cell${isPlayer ? ' player' : ''}${city.blocked.has(cell) || cell === closedRoad ? ' blocked' : ''}${cell === traffic ? ' traffic' : ''}${showClue ? ' trap-clue' : ''}${city.routeSet.has(cell) ? ' main-road' : ''}`} onClick={() => { if (distance === 1) move(Math.floor(cell / city.size) - Math.floor(player / city.size), cell % city.size - player % city.size) }} aria-label={`City block ${cell + 1} ${glyph}`}>{glyph}</button>
      })}</div>
      <div className="city-controls"><button type="button" onClick={() => move(-1, 0)}>↑</button><button type="button" onClick={() => move(0, -1)}>←</button><button type="button" onClick={() => move(1, 0)}>↓</button><button type="button" onClick={() => move(0, 1)}>→</button></div>
      <div className="city-powerups"><button type="button" disabled={!powerups.boost} onClick={() => activatePowerup('boost')}>BOOST ×{powerups.boost}</button><button type="button" disabled={!powerups.scan} onClick={() => activatePowerup('scan')}>MAP SCAN ×{powerups.scan}</button><button type="button" disabled={!powerups.shield || shieldActive} onClick={() => activatePowerup('shield')}>SHIELD ×{powerups.shield}{shieldActive ? ' · READY' : ''}</button></div>
      <GameFeedback type={feedback.includes('teslim') || feedback.includes('BONUS') || feedback.includes('KISAYOL') ? 'correct' : feedback.includes('kapalı') || feedback.includes('Trafik') ? 'wrong' : 'neutral'} combo={combo > 1 ? combo : null}>{feedback || '★ bonus için yan sokağa sap · ⚠ işareti tehlikeye komşu'}</GameFeedback>
    </div>}
  </GameShell>
}

export default CourierRushGame
