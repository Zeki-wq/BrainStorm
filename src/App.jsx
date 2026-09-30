import { useCallback, useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import { useRef } from 'react'
import Brand from './components/Brand.jsx'
import GameErrorBoundary from './components/GameErrorBoundary.jsx'
import Home from './pages/Home.jsx'
import Games from './pages/Games.jsx'
import Settings from './pages/Settings.jsx'
import Statistics from './pages/Statistics.jsx'
import Profile from './pages/Profile.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DailyChallenge from './pages/DailyChallenge.jsx'
import NotFound from './pages/NotFound.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import IntroAnimation from './components/IntroAnimation.jsx'
import { SettingsContext, defaultSettings, loadSettings, SETTINGS_KEY } from './context/SettingsContext.jsx'
import { ProgressContext } from './context/ProgressContext.jsx'
import { configureAudio, playSfx, startMenuMusic, unlockAudio } from './utils/audioManager.js'
import { localDateKey, persistResult, readDailyGoal, readProgress, readResults, resetProgress as clearAllProgress, resetResults as clearResults, safeRead, safeWrite, STORAGE_KEYS, updateStreakOnActivity, writeDailyGoal } from './utils/storage.js'
import { gameCatalog, gameComponents } from './games/gameRegistry.jsx'
import { dictionaries, languageKey, supportedLanguages } from './i18n/index.js'
import { I18nContext } from './i18n/I18nContext.jsx'
import './games/games.css'
import './games/effects.css'
import './games/expanded-games.css'
import './product.css'
import './brainstorm.css'
import './brainstorm-polish.css'
import './components/introAnimation.css'
import './components/introAnimationFix.css'

function initialPage() {
  const route = { '/':'home','/index.html':'home','/games':'games','/daily':'daily','/stats':'statistics','/profile':'profile','/settings':'settings','/login':'login','/register':'register' }
  return route[window.location.pathname] || 'notFound'
}
function initialLanguage() {
  const stored = safeRead(languageKey, null)
  if (supportedLanguages.includes(stored)) return stored
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'tr'
}

function App() {
  const [page, setPage] = useState(initialPage)
  const [language, setLanguage] = useState(initialLanguage)
  const [activeGame, setActiveGame] = useState(null)
  const [discoveryCategory, setDiscoveryCategory] = useState('All')
  const [settings, setSettings] = useState(loadSettings)
  const [showIntro, setShowIntro] = useState(() => loadSettings().showIntroAnimation)
  const [results, setResults] = useState(readResults)
  const [progress, setProgress] = useState(readProgress)
  const [dailyGoal, setDailyGoalState] = useState(readDailyGoal)
  const loadingTimerRef = useRef(null)
  const launchGameRef = useRef(null)
  const pageRef = useRef(page)
  const ActiveGame = activeGame ? gameComponents[activeGame.id] : null
  const t = key => dictionaries[language][key] || dictionaries.en[key] || key

  useEffect(() => {
    configureAudio(settings)
    document.documentElement.dataset.reducedMotion = String(settings.reducedAnimations)
    safeWrite(SETTINGS_KEY, settings)
  }, [settings])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const theme = settings.theme === 'system' ? (media?.matches ? 'dark' : 'light') : settings.theme
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
    }
    applyTheme()
    if (settings.theme !== 'system' || !media) return undefined
    media.addEventListener?.('change', applyTheme)
    return () => media.removeEventListener?.('change', applyTheme)
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.lang = language
    safeWrite(languageKey, language)
  }, [language])
  useEffect(() => () => window.clearTimeout(loadingTimerRef.current), [])
  useEffect(() => { launchGameRef.current = launchGame })
  useEffect(() => { pageRef.current = page }, [page])

  useEffect(() => {
    const onButtonClick = event => {
      if (event.target.closest('button:not(:disabled), [role="button"]')) {
        if (event.target.closest('.intro-enter-surface')) return
        unlockAudio()
        playSfx('click')
        window.setTimeout(() => { if (pageRef.current !== 'game' && pageRef.current !== 'loading') startMenuMusic() }, 90)
      }
    }
    document.addEventListener('click', onButtonClick)
    return () => document.removeEventListener('click', onButtonClick)
  }, [])

  useEffect(() => {
    const chooseAnother = event => {
      const remaining = gameCatalog.filter(game => game.id !== event.detail && game.component)
      const next = remaining[Math.floor(Math.random() * remaining.length)]
      if (next) launchGameRef.current?.(next)
    }
    window.addEventListener('brainstorm:another-game', chooseAnother)
    return () => window.removeEventListener('brainstorm:another-game', chooseAnother)
  }, [])

  function showGames(category = 'All') { window.clearTimeout(loadingTimerRef.current); setDiscoveryCategory(category); setPage('games'); setActiveGame(null) }
  function navigate(destination) {
    if (destination === 'games') { showGames(); return }
    window.clearTimeout(loadingTimerRef.current)
    setActiveGame(null)
    setPage(destination)
  }
  function launchGame(game) {
    if (!gameComponents[game.id]) return
    window.clearTimeout(loadingTimerRef.current)
    setActiveGame(game)
    setPage('loading')
    loadingTimerRef.current = window.setTimeout(() => setPage('game'), settings.reducedAnimations ? 120 : 340)
  }
  function updateSettings(patch) { setSettings(value => ({ ...value, ...patch })) }
  function resetSettings() { setSettings({ ...defaultSettings }) }
  const recordGameResult = useCallback(rawResult => {
    const timestamp = rawResult.timestamp || new Date().toISOString()
    const saved = persistResult({ ...rawResult, timestamp })
    if (!saved.saved) return
    const activityDate = new Date(timestamp)
    const nextProgress = updateStreakOnActivity(readProgress(localDateKey(activityDate)), activityDate)
    safeWrite(STORAGE_KEYS.progress, nextProgress)
    setProgress(nextProgress)
    setResults(saved.results)
  }, [])
  function resetStats() { clearResults(); setResults([]) }
  function resetAllProgress() { clearAllProgress(); setResults([]); setProgress({ currentStreak: 0, longestStreak: 0, lastActivityDate: null, totalTrainingDays: 0 }); setDailyGoalState(3) }
  function updateDailyGoal(value) { const next = Math.min(10, Math.max(1, Math.round(Number(value) || 3))); writeDailyGoal(next); setDailyGoalState(next) }

  const appSettings = { settings, updateSettings, resetSettings, dailyGoal, setDailyGoal: updateDailyGoal, resetStats, resetAllProgress, results, progress }
  const appProgress = { results, progress, dailyGoal, recordGameResult, resetStats, resetAllProgress }
  const finishIntro = useCallback(() => {
    safeWrite('brainstorm_intro_seen', true)
    setShowIntro(false)
    startMenuMusic()
  }, [])
  return <I18nContext.Provider value={{ language, setLanguage, t }}><SettingsContext.Provider value={appSettings}><ProgressContext.Provider value={appProgress}>
    <div className="app-shell" data-reduced-animations={settings.reducedAnimations}>
      <Navbar activePage={page === 'game' || page === 'loading' ? 'games' : page} onNavigate={navigate} settings={settings} onSettings={updateSettings}/>
      <main key={page} className="page-transition">{page === 'loading' ? <LoadingScreen game/> : page === 'games' ? <Games key={discoveryCategory} initialCategory={discoveryCategory} onPlay={launchGame} /> : page === 'daily' ? <DailyChallenge onPlay={launchGame} onGames={showGames}/> : page === 'settings' ? <Settings /> : page === 'statistics' ? <Statistics /> : page === 'profile' ? <Profile onPlay={launchGame} onGames={showGames} onAuth={setPage} /> : page === 'login' || page === 'register' ? <AuthPage mode={page} onModeChange={setPage} onGuest={() => setPage('home')} /> : page === 'notFound' ? <NotFound onHome={() => setPage('home')}/> : ActiveGame ? <GameErrorBoundary key={activeGame.id} onBack={showGames}><ActiveGame key={activeGame.id} onBack={showGames} /></GameErrorBoundary> : <Home onShowGames={showGames} onPlay={launchGame} onStatistics={() => setPage('statistics')} onDaily={() => setPage('daily')}/>}</main>
      <footer className="site-footer"><Brand compact/><span className="footer-note">{t('brand.tagline')}</span></footer>
      {showIntro && <IntroAnimation onComplete={finishIntro} reducedMotion={settings.reducedAnimations || (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false)} />}
    </div>
  </ProgressContext.Provider></SettingsContext.Provider></I18nContext.Provider>
}

export default App

