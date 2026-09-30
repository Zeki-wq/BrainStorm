import { useMemo } from 'react'
import { games } from '../games/gameConfig.js'
import { useProgress } from '../context/ProgressContext.jsx'
import { localDateKey } from '../utils/storage.js'
import AlienMascot from '../components/AlienMascot.jsx'
import { gameText } from '../i18n/index.js'
import { useI18n } from '../i18n/I18nContext.jsx'

function DailyChallenge({ onPlay, onGames }) {
  const { results, progress, dailyGoal } = useProgress()
  const { language, t } = useI18n()
  const today = localDateKey()
  const game = useMemo(() => games[(Number(today.replaceAll('-', '')) * 7 + 11) % games.length], [today])
  const localized = gameText(game, language)
  const sessions = results.filter(result => result.gameId === game.id && localDateKey(new Date(result.timestamp)) === today)
  const best = sessions.reduce((top, item) => Math.max(top, item.score), 0)
  const done = sessions.length > 0
  const completedToday = results.filter(result => localDateKey(new Date(result.timestamp)) === today).length
  return <section className="daily-page">
    <header className="daily-page-heading"><p className="eyebrow"><span className="eyebrow-dot"/> {t('daily.kicker')}</p><h1>{t('daily.title')}</h1><p>{t('daily.description')}</p></header>
    <article className="daily-feature"><div className="daily-feature-art"><div className="daily-art-grid"/><span className="daily-crosshair">×</span><span className="daily-art-code">DAILY TRANSMISSION / {today.replaceAll('-', '.')}</span><AlienMascot className="daily-mascot"/></div><div className="daily-feature-info"><p className="section-label">{t('daily.objective')}</p><h2>{localized.name}</h2><p>{localized.description}</p><div className="daily-tags"><span>{localized.category}</span><span>{language === 'en' ? (game.difficulty === 'Kolay' ? t('difficulty.easy') : game.difficulty === 'Orta' ? t('difficulty.medium') : t('difficulty.hard')) : game.difficulty}</span><span>{game.estimatedTime} {t('games.minutes')}</span></div><div className="daily-best"><div><small>{t('daily.yourBest')}</small><strong>{best || '—'}</strong></div><div><small>{t('home.streak')}</small><strong>{progress.currentStreak} <i>{language === 'en' ? 'days' : 'gün'}</i></strong></div><div><small>{t('home.dailyTarget')}</small><strong>{Math.min(completedToday,dailyGoal)}<i> / {dailyGoal}</i></strong></div></div>{done && <div className="daily-complete-note"><b>✓</b><span><strong>{t('daily.reward')}</strong><small>{t('daily.rewardCopy')}</small></span></div>}<div className="daily-actions"><button className="primary-button" type="button" onClick={() => onPlay?.(game)}>{done ? t('home.playAgain') : t('daily.play')} <span>↗</span></button><button className="game-secondary-button" type="button" onClick={onGames}>{t('daily.tryAnother')}</button></div></div></article>
    <div className="daily-footnote"><span>01</span><p>{language === 'en' ? `Challenge rotates each local day. Your daily session counts toward your ${dailyGoal}-game goal and existing streak.` : `Görev yerel takvime göre her gün değişir. Bugünkü oturum ${dailyGoal} oyunluk hedefine ve mevcut serine katkı sağlar.`}</p></div>
  </section>
}
export default DailyChallenge
