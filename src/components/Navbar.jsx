import Brand from './Brand.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

function Navbar({ activePage = 'home', onNavigate, settings, onSettings }) {
  const { t } = useI18n()
  const items = [
    ['home', 'nav.home'], ['games', 'nav.games'], ['daily', 'nav.daily'], ['statistics', 'nav.stats'], ['profile', 'nav.profile'],
  ]
  return <header className="topbar">
    <a className="brand" href="#home" aria-label="BRAINSTORM home" onClick={() => onNavigate?.('home')}><Brand compact /></a>
    <nav className="main-nav" aria-label="Primary navigation">{items.map(([page,key]) => <a className={`nav-link${activePage === page || (page === 'home' && activePage === 'training') ? ' active' : ''}`} href={`#${page}`} aria-current={activePage === page ? 'page' : undefined} onClick={() => onNavigate?.(page)} key={page}>{t(key)}</a>)}</nav>
    <div className="nav-tools"><LanguageSwitcher/>
      <button className={`nav-tool-button${settings?.sfxEnabled ? ' tool-enabled' : ''}`} type="button" aria-label={t('nav.sound')} aria-pressed={settings?.sfxEnabled} onClick={() => onSettings?.({ sfxEnabled: !settings?.sfxEnabled })}>{settings?.sfxEnabled ? '♫' : '♪'}</button>
      <button className="settings-access" type="button" aria-label={t('nav.theme')} onClick={() => onSettings?.({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}>{settings?.theme === 'light' ? '☼' : '◐'}</button>
      <button className="profile-button" type="button" aria-label={t('nav.profile')} onClick={() => onNavigate?.('profile')}><span>BS</span><span className="chevron">⌄</span></button>
    </div>
  </header>
}
export default Navbar
