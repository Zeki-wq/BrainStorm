import { useState } from 'react'
import GameShell from './GameShell.jsx'
import { playSfx } from '../utils/audioManager.js'
import { shuffle } from '../utils/gameRandom.js'

const missions = [
  'Kanyon geçidinden enerji hücrelerini ulaştır.', 'Atölye siparişini fırtına başlamadan hazırla.',
  'Keşif ekibini eski gözlem kulesine gönder.', 'Pazar kapanmadan nadir parçaları topla.',
  'Sinyal istasyonunu çalıştır ve ekibi geri getir.', 'Köprü onarımı için gerekli malzemeyi seç.',
  'Keşif aracının pilini ve erzakını dengede tut.', 'Son teslimat için kaynaklarını dikkatle ayır.',
]

function makeChoices(round) {
  const tension = Math.floor(round / 2)
  const risk = 0.28 + Math.min(round * 0.025, 0.2)
  return shuffle([
    { id: 'recover', title: 'Kaynağı toparla', detail: `−${4 + tension} zaman · +${15 - tension} enerji · −5 kredi`, time: 4 + tension, energy: -(15 - tension), coins: 5, risk: 0, icon: '↻' },
    { id: 'trade', title: 'Akıllı takas', detail: `−${7 + tension} zaman · −${11 + tension} enerji · +26 kredi`, time: 7 + tension, energy: 11 + tension, coins: -26, risk: 0, icon: '⇄' },
    { id: 'expedition', title: 'Riskli keşif', detail: `−${9 + tension} zaman · −${18 + tension} enerji · başarıda +58 kredi`, time: 9 + tension, energy: 18 + tension, coins: 0, risk, succeeds: Math.random() >= risk, icon: '⚑' },
  ])
}

function ResourceRushGame({ onBack }) {
  const [round, setRound] = useState(0)
  const [choices, setChoices] = useState(() => makeChoices(0))
  const [missionOrder, setMissionOrder] = useState(() => shuffle(missions))
  const [resources, setResources] = useState({ energy: 100, time: 60, coins: 50 })
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestChain, setBestChain] = useState(0)
  const [feedback, setFeedback] = useState('Her kaynak sınırlı. Kısa vadeli kazançla güvenli rotayı tart.')
  const [failed, setFailed] = useState(false)
  const complete = round >= 8 || failed

  function choose(option) {
    if (complete || option.disabled) return
    playSfx('decision')
    const gambleFailed = option.risk > 0 && !option.succeeds
    const next = {
      time: Math.max(0, resources.time - option.time),
      energy: Math.max(0, Math.min(100, resources.energy - option.energy)),
      coins: Math.max(0, resources.coins + (option.id === 'expedition' ? gambleFailed ? -12 : 58 : -option.coins)),
    }
    if (option.id === 'recover') next.coins = Math.max(0, resources.coins - 5)
    const delta = (next.coins - resources.coins) + (next.energy - resources.energy) * 0.7 + (next.time - resources.time) * 0.8
    const chain = gambleFailed ? 0 : combo + 1
    const gained = Math.max(0, Math.round(25 + delta + Math.min(chain, 5) * 12))
    setResources(next)
    setScore(value => value + gained)
    setCombo(chain)
    setBestChain(value => Math.max(value, chain))
    if (gambleFailed) { setErrors(value => value + 1); setFeedback('Keşif getirisi çıkmadı; kaynakları yeniden dengele.'); playSfx('wrong') }
    else { setFeedback(chain >= 3 ? `Verimli plan · COMBO ×${chain} · +${gained}` : `Seçim tamam · +${gained}`); playSfx(chain >= 3 ? 'combo' : 'correct') }
    const nextRound = round + 1
    setRound(nextRound)
    if (nextRound < 8 && next.time > 0 && next.energy > 0) setChoices(makeChoices(nextRound))
    else if (nextRound < 8) { setFailed(true); playSfx('gameOver') }
  }

  const labels = { energy: 'ENERGY', time: 'TIME', coins: 'COINS' }
  const values = { energy: resources.energy, time: resources.time, coins: resources.coins }
  return <GameShell title="Resource Rush" category="Planning / Decision Making" score={score} currentRound={complete ? round : round + 1} totalRounds={8} isComplete={complete} result={`${failed ? 'Görev yarıda kaldı' : 'Plan tamamlandı'} · skor ${score} · enerji ${resources.energy} · zaman ${resources.time} · kredi ${resources.coins} · en iyi seri ×${bestChain}`} onReplay={() => { setRound(0); setChoices(makeChoices(0)); setMissionOrder(shuffle(missions)); setResources({ energy: 100, time: 60, coins: 50 }); setScore(0); setErrors(0); setCombo(0); setBestChain(0); setFeedback('Her kaynak sınırlı. Kısa vadeli kazançla güvenli rotayı tart.'); setFailed(false) }} onBack={onBack}>
    {!complete && <div className="resource-rush-game">
      <div className="resource-rush-heading"><span>LEVEL {Math.min(5, Math.floor(round / 2) + 1)} · FIELD OPS {String(round + 1).padStart(2, '0')}/08</span><span>COMBO ×{combo} · HATA {errors}</span></div>
      <h2>{missionOrder[round]}</h2>
      <p className="game-skill-note">Kaynaklar sınırlı: kısa ve güvenli hamlelerle yüksek riskli ödülleri dengele.</p>
      <div className="resource-gauges">{Object.entries(values).map(([key, value]) => <div className={`resource-gauge resource-${key}`} key={key}><div><span>{labels[key]}</span><strong>{value}{key === 'time' ? 's' : ''}</strong></div><i><b style={{ width: `${value}%` }} /></i></div>)}</div>
      <p className="resource-rush-feedback" aria-live="polite">{feedback}</p>
      <div className="resource-options">{choices.map(option => {
        const disabled = resources.energy < option.energy || resources.time < option.time
        return <button className={`resource-option ${option.id}`} key={option.id} type="button" disabled={disabled} onClick={() => choose(option)}><span>{option.icon}</span><strong>{option.title}</strong><small>{option.detail}</small><em>{option.risk ? 'Risk / reward' : 'Planlı seçim'}</em></button>
      })}</div>
      <p className="resource-rush-note">Güvenli karar her zaman en yüksek puanı getirmez; kalan kaynaklarla görevleri sürdürebil.</p>
    </div>}
  </GameShell>
}

export default ResourceRushGame

