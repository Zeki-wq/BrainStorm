import { useEffect, useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { shuffle } from '../utils/gameRandom.js'

const lanes = ['NORTH', 'EAST', 'SOUTH', 'WEST']
const vehicles = ['🚙', '🚕', '🚗', '🚐', '🚑', '🚚']

function makeWave(round) {
  const count = Math.min(4, 2 + Math.floor(round / 3))
  const queues = shuffle(lanes).slice(0, count).map((lane, index) => ({
    lane,
    wait: Math.floor(Math.random() * (round + 2)),
    priority: false,
    icon: vehicles[Math.floor(Math.random() * vehicles.length)],
    id: `${round}-${index}`,
  }))
  if (round > 2 && Math.random() < 0.65) queues[Math.floor(Math.random() * queues.length)].priority = true
  const emergency = queues.find(item => item.priority)
  const expected = emergency || queues.reduce((best, item) => item.wait > best.wait ? item : best, queues[0])
  return { queues, expected }
}

function TrafficControlGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [wave, setWave] = useState(() => makeWave(0))
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(8)
  const [feedback, setFeedback] = useState('Kesişimi gözle ve önceliği seç.')
  const complete = round >= 12

  useEffect(() => { if (!complete) playSfx('car') }, [round, complete])
  useEffect(() => {
    if (complete) return undefined
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setErrors(value => value + 1)
        setCombo(0)
        setScore(value => Math.max(0, value - 45))
        setFeedback('Karar süresi doldu. Kavşak kilitlendi.')
        const next = round + 1
        setRound(next)
        if (next < 12) { setWave(makeWave(next)); setTimeLeft(Math.max(3, 8 - Math.floor(next / 2))) }
        playSfx('warning')
      } else setTimeLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [complete, round, timeLeft])

  function dispatch(vehicle) {
    if (complete) return
    const right = vehicle.id === wave.expected.id
    if (right) {
      const chain = combo + 1
      setCombo(chain)
      setCorrect(value => value + 1)
      setScore(value => value + 90 + Math.min(chain, 6) * 15)
      setFeedback(vehicle.priority ? 'Öncelikli araç güvenle geçti! COMBO' : 'Akış düzenli · doğru öncelik')
      playSfx(vehicle.priority ? 'delivery' : 'correct')
    } else {
      setCombo(0)
      setErrors(value => value + 1)
      setScore(value => Math.max(0, value - (vehicle.priority ? 45 : 30)))
      setFeedback(vehicle.priority ? 'Öncelikli araç bekletildi · hata' : 'Kavşak sıkıştı · kombo sıfırlandı')
      playSfx('wrong')
    }
    const next = round + 1
    setRound(next)
    if (next < 12) { setWave(makeWave(next)); setTimeLeft(Math.max(3, 8 - Math.floor(next / 2))) }
  }

  return <GameShell title="Traffic Control" category="Attention" score={score} currentRound={complete ? 12 : round + 1} totalRounds={12} isComplete={complete} accuracy={round ? correct / round * 100 : null} result={`Skor ${score} · araç akışı ${correct}/${round} · hata ${errors} · en uzun kombo ×${combo}`} onReplay={() => { setRound(0); setWave(makeWave(0)); setTimeLeft(8); setScore(0); setCorrect(0); setErrors(0); setCombo(0); setFeedback('Kesişimi gözle ve önceliği seç.') }} onBack={onBack}>
    {!complete && <div className="traffic-control-game">
      <div className="traffic-control-hud"><span>LEVEL {Math.min(5, Math.floor(round / 2) + 1)} · DALGA {round + 1}/12</span><span>COMBO ×{combo}</span><span>GÜVENLİ GEÇİŞ {correct}</span></div>
      <p className="traffic-control-instruction">Önce ambulansı geçir; ambulans yoksa en uzun süredir bekleyen araca yol ver.</p>
      <p className="game-skill-note">Bu arcade kavşağında önceliklendirme ve dikkati dağılımlar arasında paylaştırma çalışılır.</p>
      <div className="traffic-crossroads" aria-label="Şehir kavşağı">
        <div className="traffic-road traffic-road-ns"><span>N</span><span>S</span></div><div className="traffic-road traffic-road-ew"><span>W</span><span>E</span></div>
        <div className="traffic-center"><span className="traffic-light" aria-label="Sinyal denetimi" /><strong>+</strong></div>
        {wave.queues.map(car => <button className={`traffic-car lane-${car.lane.toLowerCase()}${car.priority ? ' priority-car' : ''}`} key={car.id} type="button" onClick={() => dispatch(car)} aria-label={`${car.priority ? 'Öncelikli araç' : 'Araç'}, ${car.lane} kolu, ${car.wait} tur bekledi`}><span>{car.priority ? '🚑' : car.icon}</span><small>{car.priority ? 'ÖNCELİKLİ' : `${car.wait} tur bekledi`}</small><b>{car.lane}</b></button>)}
      </div>
      <p className="traffic-feedback" aria-live="polite">{feedback}</p>
      <p className="traffic-hint">Doğru aracı seçince kavşağa girer; diğer şeritler sıradaki dalgada bekler.</p>
    </div>}
  </GameShell>
}

export default TrafficControlGame
