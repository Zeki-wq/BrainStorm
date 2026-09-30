import { useEffect } from 'react'
import { playSfx } from '../utils/audioManager.js'
import { useSettings } from '../context/SettingsContext.jsx'

function GameFeedback({ type = 'neutral', points, combo, children, className = '' }) {
  const { settings } = useSettings()
  useEffect(() => {
    if (type === 'correct') playSfx('correct')
    else if (type === 'wrong') playSfx('wrong')
    else if (type === 'level') playSfx('levelComplete')
    if (combo >= 2) playSfx('combo')
  }, [type, combo])
  return <div className={`game-feedback-banner ${type} ${className}${settings.reducedAnimations ? ' reduced-motion' : ''}`} role="status" aria-live="polite">
    <span>{children}</span>
    {points !== undefined && points !== null && <strong className="game-score-pop">{points >= 0 ? `+${points}` : points}</strong>}
    {combo > 1 && <small className="game-combo-pop">COMBO ×{combo}</small>}
  </div>
}

export default GameFeedback
