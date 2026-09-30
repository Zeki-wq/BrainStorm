import AlienMascot from '../components/AlienMascot.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

function NotFound({ onHome }) {
  const { t } = useI18n()
  return <section className="not-found-page"><div className="not-found-coordinate">ERROR 404 · UNKNOWN SECTOR</div><AlienMascot className="not-found-mascot"/><p className="section-label">{t('error.notFound')}</p><h1>{t('error.notFoundCopy')}</h1><button className="primary-button" type="button" onClick={onHome}>{t('error.home')} <span>↗</span></button></section>
}
export default NotFound
