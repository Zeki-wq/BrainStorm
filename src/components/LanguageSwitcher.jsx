import { useI18n } from '../i18n/I18nContext.jsx'

function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useI18n()
  return <label className={`language-control ${className}`}><span className="sr-only">{t('nav.language')}</span><select value={language} onChange={event => setLanguage(event.target.value)} aria-label={t('nav.language')}><option value="tr">TR</option><option value="en">EN</option></select></label>
}
export default LanguageSwitcher
