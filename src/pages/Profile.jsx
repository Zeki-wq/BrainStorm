import { useMemo } from 'react'
import { useProgress } from '../context/ProgressContext.jsx'
import { safeRead } from '../utils/storage.js'
import { games } from '../games/gameConfig.js'
import { getGameCategory } from '../utils/gameCategories.js'
import AlienMascot from '../components/AlienMascot.jsx'
import GameCard from '../components/GameCard.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { gameText } from '../i18n/index.js'

function Profile({ onPlay, onGames, onAuth }) {
  const { results, progress } = useProgress()
  const { language, t } = useI18n()
  const favoriteIds = safeRead('brainstorm-favorites', [])
  const favorites = games.filter(game => favoriteIds.includes(game.id))
  const records = useMemo(() => games.map(game => ({ game, score: results.filter(item => item.gameId === game.id).reduce((top, item) => Math.max(top, item.score), 0) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5), [results])
  return <section className="profile-page">
    <header className="profile-hero"><div className="profile-avatar"><AlienMascot compact/></div><div><p className="eyebrow">BRAINSTORM · PLAYER FILE</p><h1>{t('profile.title')}</h1><p>{t('profile.local')}</p></div><span className="guest-badge">{t('profile.guest')}</span></header>
    <div className="profile-metrics"><article><small>{t('profile.total')}</small><strong>{results.length}</strong></article><article><small>{t('profile.bestStreak')}</small><strong>{progress.longestStreak}<i> {language==='en'?'days':'gün'}</i></strong></article><article><small>{t('profile.tried')}</small><strong>{new Set(results.map(item => item.gameId)).size}</strong></article><article><small>{t('profile.average')}</small><strong>{results.length ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length) : '—'}</strong></article></div>
    <section className="profile-section"><div className="section-heading"><div><p className="section-label">{t('profile.shortlist')}</p><h2>{t('profile.favorite')}</h2></div><button className="text-link" type="button" onClick={onGames}>{t('home.explore')} ↗</button></div>{favorites.length ? <div className="games-grid profile-favorites">{favorites.slice(0, 4).map(game => <GameCard key={game.id} game={gameText(game,language)} results={results} onPlay={()=>onPlay?.(game)}/>)}</div> : <div className="profile-empty"><span>♡</span><p>{t('profile.noFavorites')}</p><button className="game-secondary-button" type="button" onClick={onGames}>{t('profile.explore')}</button></div>}</section>
    <section className="profile-section"><div className="section-heading"><div><p className="section-label">{t('profile.records')}</p><h2>{t('profile.bestSignals')}</h2></div></div>{records.length ? <div className="profile-record-list">{records.map(({ game, score }, index) => <article key={game.id}><b>0{index + 1}</b><span className="profile-record-icon">{game.icon}</span><div><strong>{gameText(game,language).name}</strong><small>{t(`area.${getGameCategory(game).toLowerCase()}`)} · {language==='en'?(game.difficulty==='Kolay'?t('difficulty.easy'):game.difficulty==='Orta'?t('difficulty.medium'):t('difficulty.hard')):game.difficulty}</small></div><strong className="profile-record-score">{score.toLocaleString()}</strong></article>)}</div> : <div className="profile-empty"><p>{t('profile.firstRecord')}</p><button className="primary-button" type="button" onClick={onGames}>{t('home.start')} ↗</button></div>}</section>
    <aside className="profile-account-note"><span>◉</span><p><strong>{t('profile.visitor')}</strong><br/>{t('profile.visitorCopy')}</p><button className="game-secondary-button" type="button" onClick={() => onAuth?.('register')}>{t('profile.auth')}</button></aside>
  </section>
}
export default Profile
