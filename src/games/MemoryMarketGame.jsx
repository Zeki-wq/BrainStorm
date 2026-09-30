import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { shuffle } from '../utils/gameRandom.js'

const stock = [
  ['Elma', '🍎', 'kırmızı', 'Meyve'], ['Armut', '🍐', 'yeşil', 'Meyve'], ['Muz', '🍌', 'sarı', 'Meyve'],
  ['Süt', '🥛', 'beyaz', 'İçecek'], ['Ekmek', '🍞', 'altın', 'Fırın'], ['Peynir', '🧀', 'sarı', 'Süt ürünü'],
  ['Havuç', '🥕', 'turuncu', 'Sebze'], ['Üzüm', '🍇', 'mor', 'Meyve'], ['Kahve', '☕', 'kahverengi', 'İçecek'],
  ['Domates', '🍅', 'kırmızı', 'Sebze'], ['Yoğurt', '🥣', 'beyaz', 'Süt ürünü'], ['Limon', '🍋', 'sarı', 'Meyve'],
  ['Kruvasan', '🥐', 'altın', 'Fırın'], ['Salatalık', '🥒', 'yeşil', 'Sebze'], ['Çay', '🍵', 'yeşil', 'İçecek'],
]
const product = ([name, icon, color, category], index) => ({ name, icon, color, category, price: [12, 18, 24, 31, 37, 45][(index * 7 + name.length) % 6] })

function makeRound(round) {
  const difficulty = Math.min(5, Math.floor(round / 2) + 1)
  const count = 5 + difficulty
  const prices = shuffle([12, 18, 24, 31, 37, 45, 52, 59, 66, 73]).slice(0, count)
  const shelf = shuffle(stock).slice(0, count).map((item, index) => ({ ...product(item, index), price: prices[index] }))
  const mode = ['position', 'price', 'color', 'absent', 'compare'][Math.floor(Math.random() * 5)]
  let question
  let answers
  let correct
  if (mode === 'position') {
    const position = Math.floor(Math.random() * shelf.length)
    question = `${position + 1}. rafta hangi ürün vardı?`
    correct = shelf[position].name
    answers = shuffle([correct, ...shuffle(stock.map(item => item[0]).filter(name => !shelf.some(item => item.name === name))).slice(0, 3)])
  } else if (mode === 'price') {
    const sorted = [...shelf].sort((a, b) => b.price - a.price)
    const target = sorted[Math.floor(Math.random() * Math.min(4, sorted.length))]
    question = `Hangi ürün ${target.price} krediye satılıyordu?`
    correct = target.name
    answers = shuffle([correct, ...shelf.filter(item => item.name !== correct).map(item => item.name).slice(0, 3)])
  } else if (mode === 'compare') {
    const pair = shuffle(shelf).slice(0, 2)
    const target = pair[0].price > pair[1].price ? pair[0] : pair[1]
    question = `${pair[0].name} ile ${pair[1].name} arasında hangisi daha pahalıydı?`
    correct = target.name
    answers = shuffle(pair.map(item => item.name))
  } else if (mode === 'color') {
    const target = shelf[Math.floor(Math.random() * shelf.length)]
    question = `${target.name} hangi renkteydi?`
    correct = target.color
    answers = shuffle([...new Set([correct, ...shuffle(['kırmızı', 'yeşil', 'sarı', 'beyaz', 'altın', 'mor', 'turuncu', 'kahverengi']).filter(color => color !== correct).slice(0, 3)])])
  } else {
    const absent = stock.map(item => item[0]).filter(name => !shelf.some(item => item.name === name))
    correct = absent[Math.floor(Math.random() * absent.length)]
    question = 'Hangisi rafta YOKTU?'
    answers = shuffle([correct, ...shelf.slice(0, 3).map(item => item.name)])
  }
  const duration = Math.max(1700, 4300 - difficulty * 450)
  return { difficulty, shelf, question, answers, correct, duration }
}

function MemoryMarketGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [task, setTask] = useState(() => makeRound(0))
  const [phase, setPhase] = useState('memorize')
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState('Rafı incele')
  const complete = round >= 10

  useEffect(() => {
    if (phase !== 'memorize' || complete) return undefined
    playSfx('marketReveal')
    const timer = window.setTimeout(() => { setPhase('recall'); setFeedback('Hatırladığını seç'); playSfx('countdown') }, 3200)
    return () => window.clearTimeout(timer)
  }, [round, phase, complete])

  function respond(answer) {
    if (phase !== 'recall' || complete) return
    playSfx('marketSelect')
    const right = answer === task.correct
    if (right) { setCorrect(value => value + 1); setScore(value => value + 100 + task.difficulty * 18); setFeedback('Raf bilgisi doğru! +puan'); playSfx('correct') }
    else { setErrors(value => value + 1); setScore(value => Math.max(0, value - 30)); setFeedback(`Yanlış · doğru cevap: ${task.correct}`); playSfx('wrong') }
    const next = round + 1
    setRound(next)
    if (next < 10) { setTask(makeRound(next)); setPhase('memorize') }
  }

  return <GameShell title="Memory Market" category="Memory" score={score} currentRound={complete ? 10 : round + 1} totalRounds={10} isComplete={complete} accuracy={round ? correct / round * 100 : null} result={`Skor ${score} · doğru ${correct} · hata ${errors}`} onReplay={() => { setRound(0); setTask(makeRound(0)); setPhase('memorize'); setScore(0); setCorrect(0); setErrors(0); setFeedback('Rafı incele') }} onBack={onBack}>
    {!complete && <div className={`memory-market-game ${phase}`}>
      <div className="market-topline"><span>MARKET / RAF {round + 1}</span><span>SEVİYE {task.difficulty}</span></div>
      <p className="game-skill-note">Ürünleri ve raf ayrıntılarını aklında tut; sonra farklı türde hatırlama sorularını çöz.</p>
      <div className="market-shelf" aria-label={phase === 'memorize' ? 'Ezberlenecek market rafı' : 'Gizlenmiş raf'}>{task.shelf.map((item, index) => <article className="market-product" key={`${item.name}-${index}`}><span>{phase === 'memorize' ? item.icon : '◌'}</span><strong>{phase === 'memorize' ? item.name : 'Gizli'}</strong><small>{phase === 'memorize' ? `${item.price} kr · ${item.color}` : `Konum ${index + 1}`}</small></article>)}</div>
      <div className="market-question"><small>{phase === 'memorize' ? 'HATIRLA · 3' : 'HAFIZA KASASI'}</small><h2>{phase === 'memorize' ? 'Ürünleri, fiyatları ve sıralarını incele' : task.question}</h2><p aria-live="polite">{feedback}</p></div>
      {phase === 'recall' && <div className="market-answers">{task.answers.map((answer, index) => <button key={`${answer}-${index}`} type="button" onClick={() => respond(answer)}>{answer}</button>)}</div>}
    </div>}
  </GameShell>
}

export default MemoryMarketGame
