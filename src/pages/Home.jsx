import { useMemo } from 'react'
import { games } from '../games/gameConfig.js'
import { useProgress } from '../context/ProgressContext.jsx'
import { localDateKey } from '../utils/storage.js'
import { getGameCategory } from '../utils/gameCategories.js'
import AlienMascot from '../components/AlienMascot.jsx'
import Brand from '../components/Brand.jsx'
import GameCard from '../components/GameCard.jsx'
import { gameText } from '../i18n/index.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const areas = [['Memory','⌘','Hold patterns and details in mind.','#84976a'],['Attention','⊙','Spot the signal. Ignore the noise.','#a1a778'],['Speed','↗','Make a call while the clock is running.','#b49c68'],['Logic','⟐','Connect clues and uncover a solution.','#738a67'],['Flexibility','⇄','Shift gears when the rules change.','#8a9a75']]
const areaCopy = { Memory:'Hold patterns and details in mind.', Attention:'Spot the signal. Ignore the noise.', Speed:'Make a call while the clock is running.', Logic:'Connect clues and uncover a solution.', Flexibility:'Shift gears when the rules change.' }
const estimate = id => ({memory:3,reaction:2,mathRush:2,'memory-heist':5,'bomb-defusal':5,'courier-rush':4}[id]||3)

function Home({ onShowGames, onPlay, onStatistics, onDaily }) {
  const { results, progress, dailyGoal } = useProgress()
  const { language, t } = useI18n()
  const today = localDateKey()
  const todayResults = results.filter(result => localDateKey(new Date(result.timestamp)) === today)
  const recent = [...results].reverse().slice(0,4)
  const totalScore = results.reduce((sum,result)=>sum+result.score,0)
  const average = results.length ? Math.round(totalScore/results.length) : null
  const dailyGame = useMemo(()=>games[(Number(today.replaceAll('-',''))*7+11)%games.length],[today])
  const daily = gameText(dailyGame,language)
  const dailyDifficulty = language==='en'?(dailyGame.difficulty==='Kolay'?t('difficulty.easy'):dailyGame.difficulty==='Orta'?t('difficulty.medium'):t('difficulty.hard')):dailyGame.difficulty
  const featured = useMemo(()=>{
    const played = new Set(results.map(result=>result.gameId))
    const pool = games.filter(game=>!played.has(game.id))
    const source = pool.length>=4 ? pool : games
    const seed = Number(today.replaceAll('-',''))
    return [...new Map(Array.from({length:4},(_,i)=>source[(seed+i*7)%source.length]).map(game=>[game.id,game])).values()]
  },[results,today])
  const challengeResults = todayResults.filter(result=>result.gameId===dailyGame.id)
  const dailyBest = challengeResults.reduce((best,item)=>Math.max(best,item.score),0)
  const areaCount = area => games.filter(game=>getGameCategory(game)===area).length
  const localDate = new Intl.DateTimeFormat(language==='tr'?'tr-TR':'en',{weekday:'short',month:'short',day:'numeric'}).format(new Date())
  return <div className="home-page brainstorm-home" id="home">
    <section className="cinematic-hero">
      <div className="hero-scanlines" aria-hidden="true"/><div className="hero-copy"><Brand/><p className="hero-overline"><i/>{t('home.kicker')}</p><h1>{language==='en'?<>Train Your<br/><em>Mind.</em></>:<>Zihnini<br/><em>Çalıştır.</em></>}</h1><p className="hero-description">{t('home.description')}</p><div className="hero-actions"><button className="primary-button" type="button" onClick={onShowGames}>{t('home.start')} <span>↗</span></button><span className="hero-session-note">{games.length} {t('home.missions')} <b>·</b> {t('home.noAccount')}</span></div><button className="hero-daily-link" type="button" onClick={onDaily}>⌁ {t('home.dailyTitle')} <b>↗</b></button></div>
      <div className="hero-character-stage"><div className="character-reticle"/><span className="reticle-label reticle-top">SUBJECT 01 / ONLINE</span><span className="reticle-label reticle-bottom">NEURAL ACTIVITY: STABLE</span><AlienMascot className="hero-mascot"/></div><div className="hero-coordinate">BS—01 <span>·</span> FIELD NOTES</div>
    </section>

    <section className="daily-challenge-section"><div className="section-heading"><div><p className="section-label">{t('home.dailyEyebrow')}</p><h2>{t('home.dailyTitle')}</h2></div><span className="daily-date">{localDate}</span></div><article className="daily-challenge-card"><div className="daily-challenge-sigil">{dailyGame.icon}</div><div className="daily-challenge-copy"><p>CHALLENGE NO. {Number(today.replaceAll('-',''))%97+1} <span>·</span> {daily.category.toUpperCase()}</p><h3>{daily.name}</h3><span>{daily.description}</span></div><div className="daily-challenge-status"><small>{t('home.todayBest')}</small><strong>{dailyBest||'—'}</strong><span>{challengeResults.length?t('home.challengeComplete'):`${dailyDifficulty} · ${estimate(dailyGame.id)} ${t('games.minutes')}`}</span></div><button className="primary-button" type="button" onClick={()=>onPlay?.(dailyGame)}>{challengeResults.length?t('home.playAgain'):t('home.challenge')} <span>↗</span></button></article></section>

    {recent.length>0&&<section className="continue-section"><div className="section-heading"><div><p className="section-label">{t('home.continueEyebrow')}</p><h2>{t('home.continueTitle')}</h2></div><button className="text-link" type="button" onClick={onShowGames}>{t('home.allGames')} ↗</button></div><div className="continue-strip">{recent.map(result=>{const game=games.find(item=>item.id===result.gameId);const local=game&&gameText(game,language);return <button type="button" className="continue-chip" key={result.sessionId} onClick={()=>game&&onPlay?.(game)}><span>{game?.icon||'◈'}</span><span><strong>{local?.name||result.gameName}</strong><small>{local?.category||getGameCategory(game||{id:result.gameId})} · {t('home.lastScore')} {result.score}</small></span><b>↗</b></button>})}</div></section>}

    <section className="brain-areas-section"><div className="section-heading"><div><p className="section-label">{t('home.brainEyebrow')}</p><h2>{t('home.brainTitle')}</h2></div><span className="section-aside">{t('home.brainHint')}</span></div><div className="brain-areas-grid">{areas.map(([name,icon,,color])=><button type="button" className="brain-area-card" key={name} style={{'--area-color':color}} onClick={()=>onShowGames?.(name)}><span>{icon}</span><strong>{t(`area.${name.toLowerCase()}`)}</strong><small>{language==='tr'?({Memory:'Çalışan belleği ve örüntüleri keşfet.',Attention:'Hedefi bul, dikkat dağıtıcıları ele.',Speed:'Sinyallere zamanında tepki ver.',Logic:'İpuçlarını birleştir ve çözüme ulaş.',Flexibility:'Değişen kurallara uyum sağla.'}[name]):areaCopy[name]}</small><i>{areaCount(name)} {t('home.games')} <b>↗</b></i></button>)}</div></section>

    <section className="featured-games-section"><div className="section-heading"><div><p className="section-label">{t('home.featuredEyebrow')}</p><h2>{t('home.featuredTitle')}</h2></div><button className="text-link" type="button" onClick={onShowGames}>{t('home.explore')} ↗</button></div><div className="games-grid home-featured-grid">{featured.map(game=><GameCard key={game.id} game={gameText(game,language)} results={results} onPlay={()=>onPlay?.(game)}/>)}</div></section>

    <section className="progress-section"><div className="section-heading"><div><p className="section-label">{t('home.progressEyebrow')}</p><h2>{t('home.progressTitle')}</h2></div><button className="text-link" type="button" onClick={onStatistics}>{t('home.fullReport')} ↗</button></div><div className="progress-dashboard"><article className="progress-primary"><span className="progress-emblem">✳</span><small>{t('home.streak')}</small><strong>{progress.currentStreak}<i>{language==='en'?' days':' gün'}</i></strong><span>{t('home.bestRun')} · {progress.longestStreak}{language==='en'?' days':' gün'}</span></article><article><small>{t('home.completed')}</small><strong>{results.length}</strong><span>{t('home.dailyTarget')} · {Math.min(todayResults.length,dailyGoal)}/{dailyGoal}</span><div className="mini-progress"><i style={{width:`${Math.min(100,todayResults.length/dailyGoal*100)}%`}}/></div></article><article><small>{t('home.average')}</small><strong>{average??'—'}</strong><span>{results.length?t('home.acrossSessions'):t('home.firstScore')}</span></article><article className="recent-performance"><small>{t('home.recent')}</small>{recent.length?<div className="recent-score-bars">{recent.slice(0,6).reverse().map(item=>{const peak=Math.max(...recent.map(row=>row.score),1);return <i key={item.sessionId} title={`${item.gameName}: ${item.score}`} style={{height:`${Math.max(12,item.score/peak*100)}%`}}/>})}</div>:<div className="progress-empty">{t('home.completeMission')}</div>}</article></div></section>
    <section className="why-brainstorm"><span className="why-index">B—01</span><div><p className="section-label">FIELD GUIDE · 01</p><h2>{language==='en'?'A game first. A little brainwork along the way.':'Önce oyun. Arada biraz zihin egzersizi.'}</h2></div><p>{language==='en'?'Pick a quick round or settle into a longer puzzle. Explore at your pace, switch games whenever you like, and keep your own session history.':'Kısa bir tur seç ya da uzun bir bulmacaya dal. Kendi temponda keşfet, istediğin zaman oyun değiştir ve oturum geçmişini takip et.'}</p><button className="game-secondary-button" type="button" onClick={onShowGames}>{t('home.explore')} ↗</button></section>
  </div>
}
export default Home
