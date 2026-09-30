import { useCallback, useEffect, useRef, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { sample } from '../utils/gameRandom.js'

const dictionaries = {
  MEYVE: ['ELMA', 'ARMUT', 'MUZ', 'KİVİ', 'ÜZÜM', 'KİRAZ', 'ERİK', 'ŞEFTALİ'],
  HAYVAN: ['KEDİ', 'TİLKİ', 'BALİNA', 'TAVŞAN', 'KARTAL', 'KAPLUMBAĞA', 'PANDA', 'AT'],
  ŞEHİR: ['İZMİR', 'BURSA', 'ANKARA', 'KONYA', 'EDİRNE', 'MARDİN', 'SAMSUN', 'TRABZON'],
  MESLEK: ['MİMAR', 'HEKİM', 'PİLOT', 'AŞÇI', 'TERZİ', 'ÇİFTÇİ', 'MÜZİSYEN', 'KAPTAN'],
}
const categoryNames = Object.keys(dictionaries)
const distractors = Object.values(dictionaries).flat()

function makeWord(round, usedWords = []) {
  const groupIndex = Math.floor(round / 5) % categoryNames.length
  const category = categoryNames[groupIndex]
  const target = Math.random() < 0.58
  const available = target
    ? dictionaries[category].filter(item => !usedWords.includes(item))
    : distractors.filter(item => !dictionaries[category].includes(item) && !usedWords.includes(item))
  const pool = available.length ? available : (target ? dictionaries[category] : distractors.filter(item => !dictionaries[category].includes(item)))
  const word = sample(pool)
  return { category, word, target, level: Math.min(5, Math.floor(round / 4) + 1) }
}

function WordSnapGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [task, setTask] = useState(() => makeWord(0))
  const usedWords = useRef([task.word])
  const [phase, setPhase] = useState('ready')
  const [remaining, setRemaining] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [feedback, setFeedback] = useState('Kategoriye uyanı yakala, diğerini pas geç.')
  const resolveRef = useRef(null)
  const duration = Math.max(900, 2500 - task.level * 280)
  const complete = round >= 20

  const resolve = useCallback(hit => {
    if (phase !== 'playing' || complete) return
    const right = hit === task.target
    if (right) {
      const chain = combo + 1
      setCorrect(value => value + 1)
      setCombo(chain)
      setScore(value => value + Math.round(55 + remaining / 28 + Math.min(6, chain) * 10))
      setFeedback(hit ? `SNAP! ${task.word} yakalandı` : 'İyi pas · odak korunuyor')
      playSfx(chain >= 3 ? 'combo' : 'correct')
    } else {
      setErrors(value => value + 1)
      setCombo(0)
      setScore(value => Math.max(0, value - 25))
      setFeedback(task.target ? `${task.word} kaçtı!` : `${task.word} hedef kategoriye ait değildi`)
      playSfx('wrong')
    }
    const next = round + 1
    setRound(next)
    if (next < 20) {
      const nextTask = makeWord(next, usedWords.current)
      usedWords.current.push(nextTask.word)
      setTask(nextTask)
      setRemaining(Math.max(900, 2500 - Math.min(5, Math.floor(next / 4) + 1) * 280))
    }
    setPhase(next >= 20 ? 'done' : 'playing')
  }, [phase, complete, task, combo, remaining, round])
  useEffect(() => { resolveRef.current = resolve }, [resolve])

  function start() { const first = makeWord(0); usedWords.current = [first.word]; setRound(0); setTask(first); setRemaining(2220); setPhase('playing'); setScore(0); setCorrect(0); setErrors(0); setCombo(0); setFeedback(''); }

  useEffect(() => {
    if (phase !== 'playing' || complete) return undefined
    playSfx('wordAppear')
    const began = performance.now()
    const timer = window.setInterval(() => {
      const left = Math.max(0, duration - (performance.now() - began))
      setRemaining(left)
      if (left === 0) resolveRef.current?.(false)
    }, 40)
    return () => window.clearInterval(timer)
  }, [phase, round, duration, complete])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const onKey = event => {
      if (event.code === 'Space') { event.preventDefault(); resolveRef.current?.(true) }
      if (event.key === 'ArrowLeft' || event.key === 'Escape') resolveRef.current?.(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  return <GameShell title="Word Snap" category="Language / Attention" score={score} currentRound={complete ? 20 : round + 1} totalRounds={20} isComplete={complete} accuracy={round ? correct / round * 100 : null} result={`Skor ${score} · doğruluk ${round ? Math.round(correct / round * 100) : 0}% · hata ${errors} · combo ×${combo}`} onReplay={start} onBack={onBack}>
    {!complete && <div className={`word-snap-game ${phase}`}>
      {phase === 'ready' ? <div className="word-snap-ready"><span>WORD / SNAP</span><h2>Kelimeleri doğru anda yakala.</h2><p>Kategoriye ait kelimelerde SNAP, diğerlerinde PAS. Kategori her 5 kelimede değişir.</p><p className="game-skill-note">Kategoriyi takip etme, kelime dağarcığı ve seçici dikkate odaklan.</p><button type="button" onClick={start}>Oyuna başla</button></div> : <>
        <div className="word-snap-hud"><span>LEVEL {task.level} · {round + 1}/20</span><span>COMBO ×{combo}</span><span>{(remaining / 1000).toFixed(1)}s</span></div>
        <div className="word-snap-rule"><small>{task.level < 4 || round % 5 === 0 ? 'HEDEF KATEGORİ' : 'KATEGORİ DÖNGÜSÜNÜ İZLE'}</small><strong>{task.level < 4 || round % 5 === 0 ? task.category : 'Son gösterilen kategoriyi sürdür'}</strong><i style={{ width: `${remaining / duration * 100}%` }} /></div>
        <div className="word-snap-stage" key={round}><span>{task.word}</span><small>{feedback || 'Karar ver'}</small></div>
        <div className="word-snap-actions"><button type="button" onClick={() => resolve(true)}>SNAP <small>SPACE</small></button><button type="button" onClick={() => resolve(false)}>PAS <small>←</small></button></div>
        <p className="word-snap-cycle">Kategori döngüsü · {categoryNames.join('  →  ')}</p>
      </>}
    </div>}
  </GameShell>
}

export default WordSnapGame
