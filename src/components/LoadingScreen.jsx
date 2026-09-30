import AlienMascot from './AlienMascot.jsx'
import Brand from './Brand.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

function LoadingScreen({ game = false }) {
  const { t } = useI18n()
  const lines = [t('loading.initializing'), t('loading.scanning'), t(game ? 'loading.module' : 'loading.syncing')]
  return <section className={`loading-screen${game ? ' loading-game' : ''}`} role="status" aria-live="polite">
    <div className="loading-brand"><Brand/></div><div className="loading-orbit"><span/><AlienMascot className="loading-mascot"/><i className="loading-scanline"/></div>
    <div className="loading-copy">{lines.map((line,index) => <p key={line} className={index===2?'loading-current':''}><i/> {line}</p>)}<div className="loading-progress"><i/></div><small>{t('loading.ready')}</small></div>
  </section>
}
export default LoadingScreen
