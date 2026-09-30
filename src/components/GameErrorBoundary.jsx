import { Component } from 'react'
import AlienMascot from './AlienMascot.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

function GameErrorFallback({ onRetry, onBack }) {
  const { t } = useI18n()
  return <section className="game-error-state"><AlienMascot compact/><p className="section-label">SIGNAL INTERRUPTED</p><h2>{t('game.errorTitle')}</h2><p>{t('game.errorCopy')}</p><div><button className="primary-button" type="button" onClick={onRetry}>{t('game.retry')}</button><button className="game-secondary-button" type="button" onClick={onBack}>{t('game.back')}</button></div></section>
}

class GameErrorBoundary extends Component {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) return <GameErrorFallback onRetry={() => this.setState({ error: false })} onBack={this.props.onBack}/>
    return this.props.children
  }
}
export default GameErrorBoundary
