import { useState } from 'react'
import Brand from '../components/Brand.jsx'
import AlienMascot from '../components/AlienMascot.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
function AuthPage({ mode = 'login', onModeChange, onGuest }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const { t } = useI18n()
  const registering = mode === 'register'
  function submit(event) {
    event.preventDefault()
    const next = {}
    if (!emailPattern.test(email.trim())) next.email = t('auth.badEmail')
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) next.password = t('auth.badPassword')
    if (registering && password !== confirmPassword) next.confirmPassword = t('auth.passwordMismatch')
    setErrors(next)
    setNotice(Object.keys(next).length ? '' : t('auth.offline'))
  }
  return <section className="auth-page">
    <div className="auth-card"><div className="auth-brand"><Brand/><span>YOUR MISSIONS. YOUR RECORD.</span></div><div className="auth-heading"><p className="section-label">PLAYER ACCESS / 01</p><h1>{t(registering?'auth.register':'auth.login')}</h1><p>{t(registering?'auth.registerCopy':'auth.loginCopy')}</p></div>
      <div className="auth-mode-tabs"><button type="button" className={!registering ? 'active' : ''} onClick={() => { setErrors({}); setNotice(''); onModeChange?.('login') }}>{t('auth.signin')}</button><button type="button" className={registering ? 'active' : ''} onClick={() => { setErrors({}); setNotice(''); onModeChange?.('register') }}>{t('auth.registerTab')}</button></div>
      <form className="auth-form" onSubmit={submit} noValidate><label>{t('auth.email')}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(errors.email)}/>{errors.email && <small className="auth-error">{errors.email}</small>}</label><label>{t('auth.password')}<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={t('auth.passwordHint')} aria-invalid={Boolean(errors.password)}/>{registering && <small className="auth-hint">{t('auth.passwordHint')}</small>}{errors.password && <small className="auth-error">{errors.password}</small>}</label>{registering && <label>{t('auth.confirm')}<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder={t('auth.confirm')} aria-invalid={Boolean(errors.confirmPassword)}/>{errors.confirmPassword && <small className="auth-error">{errors.confirmPassword}</small>}</label>}<button className="primary-button auth-submit" type="submit">{t(registering?'auth.create':'auth.submit')} <span>↗</span></button></form>
      {notice && <p className="auth-notice" role="status">{notice}</p>}<div className="auth-guest"><span>{t('auth.optional')}</span><button type="button" onClick={onGuest}>{t('auth.guest')} <b>↗</b></button></div>
    </div><aside className="auth-art"><div className="auth-art-ring"/><AlienMascot className="auth-mascot"/><p>“Curiosity is a useful instrument.”</p><small>FIELD NOTE 001 · BRAINSTORM</small></aside>
  </section>
}
export default AuthPage
