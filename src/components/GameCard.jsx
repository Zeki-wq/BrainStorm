import { getGameCategory } from '../utils/gameCategories.js'
import { useI18n } from '../i18n/I18nContext.jsx'

function GameCard({ game, results = [], onPlay, favorite = false, onFavorite }) {
  const { language, t } = useI18n()
  const sessions = results.filter(result => result.gameId === game.id)
  const best = sessions.reduce((value, result) => Math.max(value, result.score || 0), 0)
  const last = sessions.at(-1)
  const category = game.category || getGameCategory(game)
  const difficulty = language === 'en'
    ? (game.difficulty === 'Kolay' ? t('difficulty.easy') : game.difficulty === 'Orta' ? t('difficulty.medium') : t('difficulty.hard'))
    : game.difficulty
  return <article className={`game-card preview-${game.id}`}>
    <div className="game-card-topline"><span className="game-card-index">BL / {String(game.id).slice(0, 3).toUpperCase()}</span><span className="game-card-difficulty">{difficulty}</span>{onFavorite && <button className={`favorite-button${favorite ? ' is-favorite' : ''}`} type="button" aria-label={favorite ? (language === 'en' ? 'Remove from favorites' : 'Favorilerden çıkar') : (language === 'en' ? 'Add to favorites' : 'Favorilere ekle')} aria-pressed={favorite} onClick={() => onFavorite(game.id)}>{favorite ? '♥' : '♡'}</button>}</div>
    <div className="game-card-icon" aria-hidden="true">{game.icon || '◈'}</div>
    <h2>{game.name}</h2><p className="game-card-description">{game.description}</p>
    <div className="game-card-tags"><span>{category}</span><span>{difficulty}</span><span>◷ {game.estimatedTime || 3} {t('games.minutes')}</span></div>
    <div className="game-card-meta"><span>{best ? <>{t('games.best')} <strong>{best}</strong></> : t('games.firstRun')}</span>{last && <span className="game-card-last">{t('home.lastScore')} {last.score}</span>}</div>
    <button className="game-play-button" type="button" onClick={() => onPlay?.(game)}>{t('games.play')} <span aria-hidden="true">↗</span></button>
  </article>
}
export default GameCard
