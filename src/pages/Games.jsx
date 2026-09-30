import { useMemo, useState } from 'react'
import { games } from '../games/gameConfig.js'
import { useProgress } from '../context/ProgressContext.jsx'
import { categories, getGameCategory } from '../utils/gameCategories.js'
import { safeRead, safeWrite } from '../utils/storage.js'
import GameCard from '../components/GameCard.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { gameText } from '../i18n/index.js'

function Games({ onPlay, initialCategory = 'All' }) {
  const { results } = useProgress()
  const { language, t } = useI18n()
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('popular')
  const [difficulty, setDifficulty] = useState('All')
  const [view, setView] = useState('all')
  const [favorites, setFavorites] = useState(() => safeRead('brainstorm-favorites', []))
  const bestScores = useMemo(()=>results.reduce((map,result)=>map.set(result.gameId,Math.max(map.get(result.gameId)||0,result.score)),new Map()),[results])
  const lastPlayed = useMemo(()=>results.reduce((map,result)=>map.set(result.gameId,result.timestamp),new Map()),[results])
  const visibleGames = games.filter(game => {
    const matchesCategory = category === 'All' || getGameCategory(game) === category
    const matchesDifficulty = difficulty === 'All' || game.difficulty === difficulty
    const localized = gameText(game, language)
    const matchesQuery = `${localized.name} ${localized.description} ${localized.category} ${game.name}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesView = view === 'all' || (view === 'favorites' ? favorites.includes(game.id) : results.some(result => result.gameId === game.id))
    return matchesCategory && matchesDifficulty && matchesQuery && matchesView
  })
  const sortedGames = [...visibleGames].sort((a, b) => {
    if (sort === 'difficulty') return ({ Kolay: 1, Easy: 1, Orta: 2, Medium: 2, Zor: 3, Hard: 3 }[a.difficulty] || 0) - ({ Kolay: 1, Easy: 1, Orta: 2, Medium: 2, Zor: 3, Hard: 3 }[b.difficulty] || 0)
    if (sort === 'score') return (bestScores.get(b.id) || 0) - (bestScores.get(a.id) || 0)
    if (sort === 'newest') return games.indexOf(b) - games.indexOf(a)
    return Date.parse(lastPlayed.get(b.id)||0) - Date.parse(lastPlayed.get(a.id)||0)
  })
  function toggleFavorite(gameId) {
    const next = favorites.includes(gameId) ? favorites.filter(id => id !== gameId) : [...favorites, gameId]
    setFavorites(next)
    safeWrite('brainstorm-favorites', next)
  }
  return <section className="games-page" id="games">
    <div className="games-intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> {t('games.kicker')}</p><h1>{t('games.title')}</h1><p>{t('games.description')}</p></div><label className="games-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('games.search')} aria-label={t('games.search')} /></label></div>
    <div className="game-category-filters" aria-label="Game categories"><button type="button" className={category === 'All' ? 'active' : ''} onClick={() => setCategory('All')}>{t('games.all')} <span>{games.length}</span></button>{categories.map(item => <button type="button" className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{t(`area.${item.toLowerCase()}`)}</button>)}</div>
    <div className="game-discovery-tools"><div className="discovery-views"><button type="button" className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>{t('games.allMissions')}</button><button type="button" className={view === 'recent' ? 'active' : ''} onClick={() => setView('recent')}>{t('games.recent')}</button><button type="button" className={view === 'favorites' ? 'active' : ''} onClick={() => setView('favorites')}>♥ {t('games.favorites')}</button></div><div className="discovery-selects"><label>{t('games.difficulty')} <select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="All">{t('games.any')}</option><option value="Kolay">{t('difficulty.easy')}</option><option value="Orta">{t('difficulty.medium')}</option><option value="Zor">{t('difficulty.hard')}</option></select></label><label>{t('games.sort')} <select value={sort} onChange={event => setSort(event.target.value)} aria-label={t('games.sort')}><option value="popular">{t('games.recentSort')}</option><option value="score">{t('games.bestScore')}</option><option value="difficulty">{t('games.difficulty')}</option><option value="newest">{t('games.newest')}</option></select></label></div></div>
    <div className="games-result-meta"><span>{visibleGames.length} {t('games.found')}</span></div>
    {visibleGames.length ? <div className="games-grid">{sortedGames.map(game => <GameCard key={game.id} game={gameText(game,language)} results={results} onPlay={() => onPlay?.(game)} favorite={favorites.includes(game.id)} onFavorite={toggleFavorite}/>)}</div> : <div className="games-empty"><strong>{t('games.noSignal')}</strong><p>{t('games.tryFilters')}</p><button type="button" className="game-secondary-button" onClick={() => { setCategory('All'); setQuery(''); setDifficulty('All'); setView('all') }}>{t('games.reset')}</button></div>}
  </section>
}

export default Games


