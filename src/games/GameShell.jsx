import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playMusic, playSfx, stopMusic } from '../utils/audioManager.js'
import { useSettings } from '../context/SettingsContext.jsx'
import { useProgress } from '../context/ProgressContext.jsx'
import { games } from './gameConfig.js'
import { getGameCategory } from '../utils/gameCategories.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { gameText } from '../i18n/index.js'
import AlienMascot from '../components/AlienMascot.jsx'

function GameShell({
  title,
  category,
  score = 0,
  currentRound = 0,
  totalRounds = 0,
  timeRemaining,
  isComplete = false,
  accuracy = null,
  reactionTime = null,
  result,
  onReplay,
  onBack,
  children,
}) {
  const playAreaRef = useRef(null)
  const startedAtRef = useRef(null)
  const resultDataRef = useRef(null)
  const savedRef = useRef(false)
  const sessionIdRef = useRef('')
  const { settings } = useSettings()
  const { language, t } = useI18n()
  const { recordGameResult, results } = useProgress()
  const metadata = games.find(game => game.name === title)
  const localizedGame = metadata ? gameText(metadata, language) : null
  const displayTitle = localizedGame?.name || title
  const localizedCategory = localizedGame?.category || category
  const displayDifficulty = language==='en'?(metadata?.difficulty==='Kolay'?t('difficulty.easy'):metadata?.difficulty==='Orta'?t('difficulty.medium'):t('difficulty.hard')):metadata?.difficulty
  const previousBest = results.filter(item => item.gameId === (metadata?.id || '')).reduce((best, item) => Math.max(best, item.score), 0)
  const [bestBefore, setBestBefore] = useState(previousBest)
  const [sessionDuration, setSessionDuration] = useState(0)
  const isPersonalBest = isComplete && score > bestBefore
  useLayoutEffect(() => { resultDataRef.current = { title, score, accuracy, reactionTime, currentRound, metadata } }, [title, score, accuracy, reactionTime, currentRound, metadata])

  const saveCompletedResult = useCallback(() => {
    if (savedRef.current) return
    savedRef.current = true
    const data = resultDataRef.current
    const sessionId = sessionIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    recordGameResult({
      gameId: data.metadata?.id || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      gameName: data.title,
      category: data.metadata ? getGameCategory(data.metadata) : category || 'Other',
      score: data.score,
      accuracy: data.accuracy,
      duration: startedAtRef.current === null ? 0 : (performance.now() - startedAtRef.current) / 1000,
      level: data.currentRound,
      reactionTime: data.reactionTime,
      timestamp: new Date().toISOString(),
      sessionId,
    })
  }, [category, recordGameResult])

  useEffect(() => {
    if (!isComplete) {
      startedAtRef.current = performance.now()
      savedRef.current = false
      sessionIdRef.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      return
    }
    if (!savedRef.current) setSessionDuration(startedAtRef.current === null ? 0 : Math.max(0, Math.round((performance.now() - startedAtRef.current) / 1000)))
    saveCompletedResult()
  }, [isComplete, previousBest, saveCompletedResult])
  useEffect(() => {
    const track = title === 'Memory Heist' ? 'memory-heist' : title === 'Bomb Defusal' ? 'bomb-defusal' : title === 'Courier Rush' ? 'courier-rush' : 'puzzle'
    playMusic(track)
    return stopMusic
  }, [title, settings.musicEnabled])
  useEffect(() => { if (isComplete) playSfx('levelComplete') }, [isComplete])

  useEffect(() => {
    const root = playAreaRef.current
    if (!root) return undefined
    let lastSignature = ''
    let wasFailed = false
    const observer = new MutationObserver(() => {
      const failure = root.querySelector('.game-failure')
      if (failure && !savedRef.current) saveCompletedResult()
      if (!failure && wasFailed) {
        savedRef.current = false
        startedAtRef.current = performance.now()
        sessionIdRef.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }
      wasFailed = Boolean(failure)
      const states = root.querySelectorAll('.game-feedback, .game-feedback-banner, .level-success, .game-failure, .heist-countdown, .heist-explosion, .heist-explosion-overlay, .bomb-explosion-overlay, .courier-explosion')
      for (const state of states) {
        const text = (state.textContent || '').trim()
        const classes = typeof state.className === 'string' ? state.className : ''
        const signature = `${classes}:${text}`
        if (!text || signature === lastSignature) continue
        const lower = `${classes} ${text}`.toLowerCase()
        let sound = null
        if (state.classList.contains('heist-countdown')) sound = 'countdown'
        else if (/heist-explosion|bomb-explosion|courier-explosion|explosion/.test(lower)) sound = 'explosion'
        else if (/game-failure|failed|mission failed|system failure|time ran out/.test(lower)) sound = 'gameOver'
        else if (/warning|alarm|critical/.test(lower)) sound = 'warning'
        else if (/level-success|case-solved|device-secured|heist-clear|courier-clear|solved|tamamland|complete|unlocked|açıldı/.test(lower)) sound = 'levelComplete'
        else if (/\bwrong\b|\bnegative\b|yanlış|hatalı|hata|karıştı|süre doldu|kapalı|geçersiz/.test(lower)) sound = 'wrong'
        else if (/\bcorrect\b|doğru|teslim edildi|paket alındı|key alındı|pickup/.test(lower)) sound = 'correct'
        if (sound) { lastSignature = signature; playSfx(sound); break }
      }
    })
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [saveCompletedResult])

  const progress = totalRounds > 0
    ? Math.min((currentRound / totalRounds) * 100, 100)
    : 0

  return (
    <section className="game-shell" aria-label={title ? `${title} oyunu` : 'Oyun'}>
      <div className="game-shell-header game-command-bar">
        <button className="game-back-button" type="button" onClick={onBack}><span aria-hidden="true">←</span> {t('game.back')}</button>
        <span className="game-mode-label">BRAINSTORM <i>//</i> SIMULATION</span>
        <div className="game-header-tags"><span className="game-category">{localizedCategory}</span><span className="game-difficulty-tag">{displayDifficulty}</span></div>
      </div>

      <div className="game-shell-title-row">
        <div><p className="section-label">{t('game.training')}</p><h1>{displayTitle}</h1><p className="game-objective"><small>{t('game.objective')}</small>{localizedGame?.description}</p></div>
        <div className="game-score"><span>{t('game.score')}</span><strong key={score}>{score}</strong></div>
      </div>

      <div className="game-hud">
        <div className="game-progress-meta"><span>{t('game.round')} <strong>{currentRound}</strong> / {totalRounds}</span><span>{t('game.time')} <strong>{timeRemaining !== undefined ? timeRemaining : '—'}</strong></span><span>{t('game.accuracy')} <strong>{accuracy === null ? '—' : `${Math.round(accuracy)}%`}</strong></span></div>
        <div className="game-progress-track" role="progressbar" aria-label={t('game.round')} aria-valuemin={0} aria-valuemax={totalRounds} aria-valuenow={currentRound}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="game-play-area" ref={playAreaRef}>
        {isComplete ? (
          <div className="game-result">
            <AlienMascot className="game-result-mascot"/>
            <p className="section-label">{isPersonalBest ? t('game.newRecord') : t('game.complete')}</p>
            <h2>{isPersonalBest ? t('game.recordTitle') : t('game.completeTitle')}</h2>
            <div className="game-result-copy">{result ?? `${t('game.score')}: ${score}`}</div>
            <div className="result-metrics"><span><small>{t('game.score')}</small><strong>{score}</strong></span>{accuracy !== null && <span><small>{t('game.accuracy')}</small><strong>{Math.round(accuracy)}%</strong></span>}<span><small>{t('game.time')}</small><strong>{sessionDuration}s</strong></span><span><small>{t('game.bestBefore')}</small><strong>{bestBefore || '—'}</strong></span><span><small>{t('game.level')}</small><strong>{currentRound || '—'}</strong></span></div>
            <div className="game-result-actions">
              <button className="primary-button" type="button" onClick={() => { setBestBefore(Math.max(bestBefore, score)); onReplay?.() }}>{t('game.playAgain')} <span aria-hidden="true">↻</span></button>
              <button className="game-secondary-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent('brainstorm:another-game', { detail: metadata?.id }))}>{t('game.another')} <span aria-hidden="true">↗</span></button>
              <button className="game-secondary-button" type="button" onClick={onBack}>{t('game.back')}</button>
            </div>
          </div>
        ) : children ?? <p className="game-placeholder">Oyun alanı</p>}
      </div>

      {!isComplete && <div className="game-shell-footer"><button className="game-secondary-button" type="button" onClick={onBack}>{t('game.back')}</button><span className="game-assistant-note"><AlienMascot compact/> {language==='en'?'Stay curious. Change missions anytime.':'Merakını koru. İstediğin an oyun değiştirebilirsin.'}</span></div>}
    </section>
  )
}

export default GameShell
