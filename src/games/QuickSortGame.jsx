import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import GameFeedback from '../components/GameFeedback.jsx'

const TOTAL_ROUNDS = 15
const SHAPES = ['●', '▲', '■', '◆']
const COLORS = [{ name: 'KIRMIZI', value: '#ef737e' }, { name: 'MAVİ', value: '#73a8f4' }, { name: 'YEŞİL', value: '#70d2a0' }]

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function choose(values) { return values[Math.floor(Math.random() * values.length)] }

function makeTrialData(round) {
  if (round === 1) {
    const number = Math.floor(Math.random() * 20) + 1
    return { rule: 'Sayıyı sınıflandır', instruction: 'Sayı tek mi çift mi?', prompt: String(number), categories: ['TEK', 'ÇİFT'], answer: number % 2 ? 'TEK' : 'ÇİFT' }
  }
  if (round === 2 || round === 5) {
    const small = Math.random() < 0.5
    const value = small ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 5) + 6
    return { rule: 'Büyük / küçük', instruction: '5 ve altı küçük, 5 üstü büyük.', prompt: String(value), categories: ['KÜÇÜK', 'BÜYÜK'], answer: small ? 'KÜÇÜK' : 'BÜYÜK' }
  }
  if (round === 3) {
    const color = choose(COLORS)
    return { rule: 'Renk', instruction: 'Nesnenin rengini seç.', prompt: '●', color: color.value, categories: shuffle(COLORS.map(item => item.name)), answer: color.name }
  }
  if (round === 4) {
    const shape = choose(SHAPES)
    return { rule: 'Şekil', instruction: 'Üçgen mi, başka bir şekil mi?', prompt: shape, categories: ['ÜÇGEN', 'DİĞER'], answer: shape === '▲' ? 'ÜÇGEN' : 'DİĞER' }
  }
  if (round === 6 || round === 12) {
    const number = Math.floor(Math.random() * 10) + 1
    const categories = ['1–3', '4–7', '8–10']
    const answer = number <= 3 ? '1–3' : number <= 7 ? '4–7' : '8–10'
    return { rule: 'Sayı aralığı', instruction: 'Sayıyı doğru aralığa yerleştir.', prompt: String(number), categories, answer }
  }
  if (round === 7 || round === 14) {
    const count = Math.floor(Math.random() * 4) + 1
    const prompt = Array.from({ length: count }, () => choose(SHAPES)).join(' ')
    return { rule: 'Şekil sayısı', instruction: 'İki veya daha fazla şekil var mı?', prompt, categories: ['2+ ŞEKİL', '1 ŞEKİL'], answer: count >= 2 ? '2+ ŞEKİL' : '1 ŞEKİL' }
  }
  if (round === 8) {
    const color = choose(COLORS.slice(0, 2))
    const small = Math.random() < 0.5
    return { rule: 'Renk + boyut', instruction: 'Küçük ve kırmızı olanı seç.', prompt: '●', color: color.value, small, categories: ['KÜÇÜK KIRMIZI', 'DİĞER'], answer: color.name === 'KIRMIZI' && small ? 'KÜÇÜK KIRMIZI' : 'DİĞER' }
  }
  if (round === 9) {
    const shape = choose(SHAPES)
    const large = Math.random() < 0.5
    return { rule: 'Şekil + boyut', instruction: 'Büyük üçgen olanı seç.', prompt: shape, large, categories: ['BÜYÜK ÜÇGEN', 'DİĞER'], answer: shape === '▲' && large ? 'BÜYÜK ÜÇGEN' : 'DİĞER' }
  }
  if (round === 10 || round === 15) {
    const number = Math.floor(Math.random() * 10) + 1
    const color = choose(COLORS.slice(0, 2))
    const match = number % 2 === 0 && color.name === 'MAVİ'
    return { rule: 'İki aşamalı karar', instruction: 'Sayı çift VE nesne mavi mi?', prompt: `${number}  ●`, color: color.value, categories: ['İKİSİ DE', 'DİĞER'], answer: match ? 'İKİSİ DE' : 'DİĞER' }
  }
  if (round === 11) {
    const number = Math.floor(Math.random() * 9) + 1
    return { rule: 'Aralık sınırları', instruction: '3’ten büyük ama 8’den küçük mi?', prompt: String(number), categories: ['EVET', 'HAYIR'], answer: number > 3 && number < 8 ? 'EVET' : 'HAYIR' }
  }
  const color = choose(COLORS.slice(0, 2))
  const large = Math.random() < 0.5
  const circle = Math.random() < 0.5
  const answer = color.name === 'KIRMIZI' || large
  return { rule: 'Birleşik kural', instruction: 'Kırmızı VEYA büyük olanları seç.', prompt: circle ? '●' : '▲', color: color.value, large, categories: ['UYGUN', 'DİĞER'], answer: answer ? 'UYGUN' : 'DİĞER' }
}

function makeTrial(round) {
  const trial = makeTrialData(round)
  return { ...trial, categories: shuffle(trial.categories) }
}

function QuickSortGame({ onBack }) {
  const [round, setRound] = useState(1)
  const [trial, setTrial] = useState(() => makeTrial(1))
  const [startedAt, setStartedAt] = useState(() => performance.now())
  const [feedback, setFeedback] = useState(null)
  const [scorePopup, setScorePopup] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [answerTimes, setAnswerTimes] = useState([])
  const complete = round > TOTAL_ROUNDS

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => {
      setScorePopup(null)
      if (round === TOTAL_ROUNDS) { setRound(TOTAL_ROUNDS + 1); setFeedback(null); return }
      const next = round + 1
      setRound(next); setTrial(makeTrial(next)); setStartedAt(performance.now()); setFeedback(null)
    }, 420)
    return () => window.clearTimeout(timer)
  }, [feedback, round])

  function choose(category, event) {
    if (feedback || complete) return
    const elapsed = Math.max(0, Math.round(event.timeStamp - startedAt))
    const isCorrect = category === trial.answer
    setAnswerTimes(times => [...times, elapsed]); setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      const nextStreak = streak + 1
      setStreak(nextStreak); setLongestStreak(value => Math.max(value, nextStreak)); setCorrect(value => value + 1)
      const multiplier = nextStreak >= 10 ? 4 : nextStreak >= 6 ? 3 : nextStreak >= 3 ? 2 : 1
      const points = (100 + Math.max(0, Math.round(250 - elapsed / 20))) * multiplier
      setScore(value => value + points); setScorePopup(points)
    } else {
      setStreak(0); setErrors(value => value + 1); setScore(value => Math.max(0, value - 35)); setScorePopup(-35)
    }
  }

  function replay() {
    setRound(1); setTrial(makeTrial(1)); setStartedAt(performance.now()); setFeedback(null); setScorePopup(null)
    setCorrect(0); setErrors(0); setScore(0); setStreak(0); setLongestStreak(0); setAnswerTimes([])
  }

  const average = answerTimes.length ? `${(answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length / 1000).toFixed(2)} sn` : '—'
  const result = <div className="new-game-result"><span>Skor<strong>{score}</strong></span><span>Doğru<strong>{correct}</strong></span><span>Yanlış<strong>{errors}</strong></span><span>Ortalama reaction time<strong>{average}</strong></span><span>En uzun seri<strong>{longestStreak}</strong></span></div>

  return <GameShell title="Quick Sort" category="Attention" score={score} accuracy={ correct + errors > 0 ? correct / (correct + errors) * 100 : null } reactionTime={ answerTimes.length ? answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length : null } currentRound={complete ? TOTAL_ROUNDS : round - 1} totalRounds={TOTAL_ROUNDS} isComplete={complete} result={result} onReplay={replay} onBack={onBack}>
    <div className="quick-sort-game" tabIndex={0} onKeyDown={event => { const index = Number(event.key) - 1; if (index >= 0 && index < trial.categories.length) { event.preventDefault(); choose(trial.categories[index], { timeStamp: performance.now() }) } }}>
      <p className="new-game-prompt">{trial.rule}</p>
      <p className="quick-sort-instruction">{trial.instruction}</p>
      <div className={`quick-sort-conveyor ${feedback === 'wrong' ? 'sort-reject' : feedback === 'correct' ? 'sort-accept' : ''}`} style={{ '--belt-duration': `${Math.max(1.15, 3 - round * 0.1)}s` }}>
        <div className="quick-sort-belt" aria-hidden="true" />
        <div className={`quick-sort-item${trial.large ? ' large' : ''}${trial.small ? ' small' : ''}`} style={{ color: trial.color }}>{trial.prompt}</div>
        <span className="quick-sort-streak">COMBO {streak} · x{streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1}</span>
      </div>
      <div className="quick-sort-options">{trial.categories.map(category => <button type="button" key={category} onClick={event => choose(category, event)} disabled={feedback !== null}>{category}<small>KUTUYA GÖNDER</small></button>)}</div>
      <GameFeedback type={feedback ?? 'neutral'} points={scorePopup} combo={streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1}>{feedback === 'correct' ? 'Doğru kutu · bant hızlanıyor!' : feedback === 'wrong' ? 'Yanlış kutu · combo sıfırlandı.' : 'Ürünü doğru bölmeye gönder.'}</GameFeedback>
    </div>
  </GameShell>
}

export default QuickSortGame
