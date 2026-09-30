import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'

const TOTAL_ROUNDS = 10
const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function shortestPath(map, blockers = map.movingBlockers) {
  const queue = [{ pos: map.start, key: false, targets: 0, path: [map.start] }]
  const seen = new Set()
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor]
    const stateKey = `${state.pos}-${Number(state.key)}-${state.targets}`
    if (seen.has(stateKey)) continue
    seen.add(stateKey)
    if (state.pos === map.goal && state.key && state.targets === 3) return state.path
    const row = Math.floor(state.pos / map.size)
    const col = state.pos % map.size
    for (const [dy, dx] of DIRECTIONS) {
      const nextRow = row + dy
      const nextCol = col + dx
      if (nextRow < 0 || nextRow >= map.size || nextCol < 0 || nextCol >= map.size) continue
      const pos = nextRow * map.size + nextCol
      if (map.walls.has(pos) || blockers.has(pos) || (pos === map.door && !state.key)) continue
      const key = state.key || pos === map.key
      const targets = state.targets | (pos === map.targets[0] ? 1 : 0) | (pos === map.targets[1] ? 2 : 0)
      queue.push({ pos, key, targets, path: [...state.path, pos] })
    }
  }
  return null
}

function makeMap(round) {
  const size = round <= 2 ? 5 : round <= 4 ? 6 : round <= 6 ? 7 : round <= 8 ? 8 : 9
  const corridor = []
  for (let col = 0; col < size; col += 1) corridor.push(col)
  for (let row = 1; row < size; row += 1) corridor.push(row * size + size - 1)
  const corridorSet = new Set(corridor)
  const walls = new Set()
  const movingPool = []
  const decoys = new Set()
  for (let index = 0; index < size * size; index += 1) {
    if (corridorSet.has(index)) continue
    if (Math.random() < 0.22 + round * 0.025) walls.add(index)
    else if (Math.random() < 0.2) movingPool.push(index)
    else if (Math.random() < 0.4) decoys.add(index)
  }
  const map = {
    size, start: 0, key: corridor[1], targets: [corridor[2], corridor.at(-3)],
    door: corridor.at(-2), goal: corridor.at(-1), walls, movingPool,
    movingBlockers: new Set(movingPool.slice(0, Math.min(2, Math.floor(round / 3) + 1))),
    decoys, moveLimit: 0, timeLimit: 0,
  }
  const path = shortestPath(map)
  if (!path) return makeMap(round)
  map.optimalPath = path
  map.optimalMoves = path.length - 1
  map.moveLimit = map.optimalMoves + Math.max(5, Math.floor(size * 0.8))
  map.timeLimit = 25 + size * 7
  return map
}

function GridPathGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [map, setMap] = useState(() => makeMap(1))
  const [position, setPosition] = useState(0)
  const [visited, setVisited] = useState([0])
  const [hasKey, setHasKey] = useState(false)
  const [targetMask, setTargetMask] = useState(0)
  const [movingBlockers, setMovingBlockers] = useState(map.movingBlockers)
  const [moves, setMoves] = useState(0)
  const [roundMoves, setRoundMoves] = useState(0)
  const [remaining, setRemaining] = useState(map.timeLimit)
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [feedback, setFeedback] = useState('')
  const [solved, setSolved] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [score, setScore] = useState(0)
  const [optimalTotal, setOptimalTotal] = useState(0)
  const [solveTimes, setSolveTimes] = useState([])
  const complete = round > TOTAL_ROUNDS
  const playing = !complete && !feedback

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setTimeout(() => {
      if (remaining <= 1) { setRemaining(0); setFeedback('Süre doldu'); setMistakes(value => value + 1) }
      else setRemaining(remaining - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [playing, round, remaining])

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      if (round === TOTAL_ROUNDS) { setRound(TOTAL_ROUNDS + 1); setFeedback(''); return }
      const next = round + 1
      const nextMap = makeMap(next)
      setRound(next); setMap(nextMap); setPosition(0); setVisited([0]); setHasKey(false); setTargetMask(0)
      setMovingBlockers(nextMap.movingBlockers); setRoundMoves(0); setRemaining(nextMap.timeLimit); setStartedAt(performance.now()); setFeedback('')
    }, 700)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function moveTo(index, event) {
    if (!playing || map.walls.has(index) || movingBlockers.has(index)) return
    const rowDiff = Math.abs(Math.floor(index / map.size) - Math.floor(position / map.size))
    const colDiff = Math.abs((index % map.size) - (position % map.size))
    if (rowDiff + colDiff !== 1) return
    if (index === map.door && !hasKey) return
    const nextMoves = roundMoves + 1
    const nextKey = hasKey || index === map.key
    const nextTargets = targetMask | (index === map.targets[0] ? 1 : 0) | (index === map.targets[1] ? 2 : 0)
    if (index === map.goal && (!nextKey || nextTargets !== 3)) return
    setPosition(index); setVisited(path => [...path, index]); setMoves(value => value + 1); setRoundMoves(nextMoves)
    setHasKey(nextKey); setTargetMask(nextTargets)
    if (nextMoves % 3 === 0 && map.movingPool.length) {
      const nextIndex = (nextMoves + round) % map.movingPool.length
      const blocker = map.movingPool[nextIndex]
      if (blocker !== index) setMovingBlockers(new Set([blocker]))
    }
    if (index === map.goal && nextKey && nextTargets === 3) {
      const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
      const efficiency = Math.max(0, map.optimalMoves - nextMoves)
      const gained = Math.max(50, 700 + efficiency * 45 + remaining * 3 - Math.floor(elapsed / 1000) * 2)
      setSolved(value => value + 1); setOptimalTotal(value => value + map.optimalMoves); setScore(value => value + gained); setSolveTimes(times => [...times, elapsed]); setFeedback('Harita tamamlandı!')
    } else if (nextMoves >= map.moveLimit) {
      setMistakes(value => value + 1); setFeedback('Hareket limiti doldu')
    }
  }

  function replay() {
    const nextMap = makeMap(1)
    setRound(1); setMap(nextMap); setPosition(0); setVisited([0]); setHasKey(false); setTargetMask(0); setMovingBlockers(nextMap.movingBlockers)
    setMoves(0); setRoundMoves(0); setRemaining(nextMap.timeLimit); setStartedAt(performance.now()); setFeedback('')
    setSolved(0); setMistakes(0); setScore(0); setOptimalTotal(0); setSolveTimes([])
  }

  const average = solveTimes.length ? `${(solveTimes.reduce((sum, time) => sum + time, 0) / solveTimes.length / 1000).toFixed(1)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Tamamlanan harita<strong>{solved}</strong></span><span>Hata<strong>{mistakes}</strong></span><span>Hamle / optimal<strong>{moves} / {optimalTotal}</strong></span><span>Ortalama süre<strong>{average}</strong></span></div>

  return <GameShell title="Grid Path" category="Problem Solving" score={score} accuracy={ solved + mistakes > 0 ? solved / (solved + mistakes) * 100 : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} timeRemaining={`${remaining}s`} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="grid-path-game advanced-grid-path">
      <p className="new-game-prompt">Anahtarı bul, iki hedefi al ve kapıdan çık</p>
      <div className="path-objective-line"><span>{hasKey ? '✓ Anahtar' : '🔑 Anahtar'}</span><span>{targetMask & 1 ? '✓' : '○'} Hedef 1</span><span>{targetMask & 2 ? '✓' : '○'} Hedef 2</span><span>🚪 Kapı → Çıkış</span></div>
      <div className="grid-path-board" style={{ '--grid-size': map.size }}>
        {Array.from({ length: map.size ** 2 }, (_, index) => {
          const marker = index === position ? 'S' : index === map.goal ? 'G' : index === map.key ? (hasKey ? '✓' : 'K') : index === map.door ? 'D' : index === map.targets[0] ? (targetMask & 1 ? '✓' : '1') : index === map.targets[1] ? (targetMask & 2 ? '✓' : '2') : map.walls.has(index) ? '×' : movingBlockers.has(index) ? '●' : map.decoys.has(index) ? '·' : ''
          return <button className={`path-cell${map.walls.has(index) ? ' wall' : ''}${movingBlockers.has(index) ? ' moving-wall' : ''}${visited.includes(index) ? ' visited' : ''}${position === index ? ' player' : ''}${index === map.goal ? ' goal' : ''}${map.decoys.has(index) ? ' decoy' : ''}`} key={`${round}-${index}`} type="button" onClick={event => moveTo(index, event)} disabled={!playing || map.walls.has(index)} aria-label={`Hücre ${index + 1}: ${marker}`}>
            {marker}
          </button>
        })}
      </div>
      <p className="path-status">Hamle {roundMoves}/{map.moveLimit} · Optimal {map.optimalMoves}</p>
      <p className={`game-feedback ${feedback.includes('tamamlandı') ? 'correct' : feedback ? 'wrong' : ''}`} aria-live="polite">{feedback}</p>
    </div>
  </GameShell>
}

export default GridPathGame
