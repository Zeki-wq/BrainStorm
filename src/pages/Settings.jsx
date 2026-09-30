import { useEffect, useState } from 'react'
import { useSettings } from '../context/SettingsContext.jsx'
import { playMusic, playSfx, stopMusic } from '../utils/audioManager.js'
import { useI18n } from '../i18n/I18nContext.jsx'

function Settings() {
  const { settings, updateSettings, resetSettings, dailyGoal, setDailyGoal, resetStats, resetAllProgress } = useSettings()
  const { language, setLanguage, t } = useI18n()
  const [confirm, setConfirm] = useState(null)
  useEffect(() => () => stopMusic(), [])
  function confirmReset() {
    if (confirm === 'stats') resetStats()
    if (confirm === 'all') resetAllProgress()
    setConfirm(null)
  }
  return <section className="settings-page">
    <div className="settings-intro"><p className="eyebrow"><span className="eyebrow-dot" /> BRAINSTORM · SYSTEM</p><h1>{t('settings.title')}</h1><p>{t('settings.description')}</p></div>
    <div className="settings-grid">
      <section className="settings-card"><p className="settings-section-label">{t('settings.appearance')}</p>
        <label className="settings-select"><span><strong>{t('settings.theme')}</strong><small>{t('settings.themeHint')}</small></span><select value={settings.theme} onChange={event => updateSettings({ theme: event.target.value })}><option value="system">{t('settings.system')}</option><option value="light">{t('settings.light')}</option><option value="dark">{t('settings.dark')}</option></select></label>
        <label className="settings-select"><span><strong>{t('settings.language')}</strong><small>Türkçe / English</small></span><select value={language} onChange={event => setLanguage(event.target.value)}><option value="tr">Türkçe</option><option value="en">English</option></select></label>
        <label className="settings-toggle"><span><strong>{t('settings.motion')}</strong><small>{t('settings.motionHint')}</small></span><input type="checkbox" checked={settings.reducedAnimations} onChange={event => updateSettings({ reducedAnimations: event.target.checked })} /><i aria-hidden="true" /></label>
        <label className="settings-toggle"><span><strong>{t('settings.showIntro')}</strong><small>{t('settings.showIntroHint')}</small></span><input type="checkbox" checked={settings.showIntroAnimation} onChange={event => updateSettings({ showIntroAnimation: event.target.checked })} /><i aria-hidden="true" /></label>
      </section>
      <section className="settings-card"><p className="settings-section-label">{t('settings.audio')}</p>
        <label className="settings-slider"><span><strong>{t('settings.masterVolume')}</strong><output>{settings.masterVolume}%</output></span><input type="range" min="0" max="100" value={settings.masterVolume} onChange={event => updateSettings({ masterVolume: Number(event.target.value) })} /></label>
        <label className="settings-toggle"><span><strong>{t('settings.sfx')}</strong><small>{t('settings.sfxHint')}</small></span><input type="checkbox" checked={settings.sfxEnabled} onChange={event => updateSettings({ sfxEnabled: event.target.checked })} /><i aria-hidden="true" /></label>
        <label className="settings-slider"><span><strong>{t('settings.sfxVolume')}</strong><output>{settings.sfxVolume}%</output></span><input type="range" min="0" max="100" value={settings.sfxVolume} onChange={event => updateSettings({ sfxVolume: Number(event.target.value) })} disabled={!settings.sfxEnabled} /></label>
        <label className="settings-toggle"><span><strong>{t('settings.music')}</strong><small>{t('settings.musicHint')}</small></span><input type="checkbox" checked={settings.musicEnabled} onChange={event => updateSettings({ musicEnabled: event.target.checked })} /><i aria-hidden="true" /></label>
        <label className="settings-slider"><span><strong>{t('settings.musicVolume')}</strong><output>{settings.musicVolume}%</output></span><input type="range" min="0" max="100" value={settings.musicVolume} onChange={event => updateSettings({ musicVolume: Number(event.target.value) })} disabled={!settings.musicEnabled} /></label>
        <div className="settings-preview"><button type="button" className="game-secondary-button" onClick={() => playSfx('correct')}>{t('settings.trySound')}</button><button type="button" className="game-secondary-button" onClick={() => playMusic('puzzle')}>{t('settings.tryMusic')}</button><button type="button" className="game-secondary-button" onClick={stopMusic}>{t('settings.stopMusic')}</button></div>
      </section>
      <section className="settings-card"><p className="settings-section-label">{t('settings.training')}</p>
        <label className="settings-select"><span><strong>{t('settings.goal')}</strong><small>{t('settings.goalHint')}</small></span><select value={dailyGoal} onChange={event => setDailyGoal(Number(event.target.value))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} {language==='en'?'games':'oyun'}</option>)}</select></label>
      </section>
      <section className="settings-card settings-data-card"><p className="settings-section-label">{t('settings.data')}</p>
        <div className="settings-data-row"><span><strong>{t('settings.resetStats')}</strong><small>{t('settings.resetStatsHint')}</small></span><button className="game-secondary-button" type="button" onClick={() => setConfirm('stats')}>{t('settings.reset')}</button></div>
        <div className="settings-data-row"><span><strong>{t('settings.resetAll')}</strong><small>{t('settings.resetAllHint')}</small></span><button className="settings-danger-button" type="button" onClick={() => setConfirm('all')}>{t('settings.resetEvery')}</button></div>
        <div className="settings-footer"><p>{t('settings.localNote')}</p><button className="game-secondary-button" type="button" onClick={resetSettings}>{t('settings.defaults')}</button></div>
      </section>
    </div>
    {confirm && <div className="settings-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfirm(null) }}><section className="settings-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description"><p className="section-label">{t('settings.confirm')}</p><h2 id="reset-title">{t(confirm === 'stats' ? 'settings.resetHistoryTitle' : 'settings.resetProgressTitle')}</h2><p id="reset-description">{confirm === 'stats' ? t('settings.resetStatsHint') : t('settings.resetAllHint')}</p><div><button className="game-secondary-button" type="button" onClick={() => setConfirm(null)}>{t('settings.cancel')}</button><button className="settings-danger-button" type="button" onClick={confirmReset}>{t('settings.delete')}</button></div></section></div>}
  </section>
}

export default Settings
