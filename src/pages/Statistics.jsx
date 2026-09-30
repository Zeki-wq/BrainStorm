import { useMemo } from 'react'
import { useProgress } from '../context/ProgressContext.jsx'
import { games } from '../games/gameConfig.js'
import { localDateKey } from '../utils/storage.js'
import { getGameCategory } from '../utils/gameCategories.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const categoryName = id => { const game = games.find(item => item.id === id); return game ? getGameCategory(game) : 'Other' }
const dateLabel = (date, language) => new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en', { weekday: 'short' }).format(date)

function Statistics() {
  const { results, progress } = useProgress()
  const { language, t } = useI18n()
  const now = new Date()
  const nowTime = now.getTime()
  const today = localDateKey(now)
  const todayResults = results.filter(result => localDateKey(new Date(result.timestamp)) === today)
  const weekResults = results.filter(result => {
    const date = new Date(result.timestamp)
    return Number.isFinite(date.getTime()) && (nowTime - date.getTime()) / 86400000 < 7 && date.getTime() <= nowTime
  })
  const summary = useMemo(() => {
    const accuracies = results.filter(result => Number.isFinite(result.accuracy))
    const best = results.reduce((top, result) => !top || result.score > top.score ? result : top, null)
    return {
      duration: results.reduce((sum, result) => sum + result.duration, 0),
      avgScore: results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : null,
      avgAccuracy: accuracies.length ? Math.round(accuracies.reduce((sum, result) => sum + result.accuracy, 0) / accuracies.length) : null,
      best,
    }
  }, [results])
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const count = results.filter(result => localDateKey(new Date(result.timestamp)) === localDateKey(date)).length
    return { date, count }
  })
  const categories = ['Memory', 'Attention', 'Speed', 'Logic', 'Flexibility']
  const categoryStats = categories.map(category => {
    const group = results.filter(result => categoryName(result.gameId) === category)
    return { category, count: group.length, score: Math.round(group.reduce((sum, result) => sum + result.score, 0) / group.length) }
  })
  const recent = [...results].reverse().slice(0, 12)
  const totalMinutes = Math.floor(summary.duration / 60)
  const metrics = [
    [t('stats.played'), results.length, t('stats.sessions')],
    [t('stats.completed'), results.length, language==='en'?'Completed sessions':'Tamamlanan oturumlar'],
    [t('stats.currentStreak'), `${progress.currentStreak} ${language==='en'?'days':'gün'}`, language==='en'?'Consecutive active days':'Ardışık aktif gün'],
    [t('stats.bestStreak'), `${progress.longestStreak} ${language==='en'?'days':'gün'}`, language==='en'?'Personal record':'Kişisel rekor'],
    [t('stats.duration'), totalMinutes ? `${totalMinutes} ${t('games.minutes')}` : `${summary.duration} ${language==='en'?'sec':'sn'}`, language==='en'?'Recorded game time':'Kaydedilen oyun süresi'],
    [t('stats.averageScore'), summary.avgScore ?? '—', results.length ? t('stats.sessions') : t('stats.noData')],
    [t('stats.accuracy'), summary.avgAccuracy === null ? '—' : `${summary.avgAccuracy}%`, summary.avgAccuracy === null ? t('stats.noData') : t('stats.accuracy')],
    [t('stats.bestScore'), summary.best?.score ?? '—', summary.best?.gameName || t('stats.noData')],
    [language==='en'?'Today':'Bugün', todayResults.length, language==='en'?'Local calendar day':'Yerel takvim günü'],
    [language==='en'?'This week':'Bu hafta', weekResults.length, t('stats.lastWeek')],
  ]
  return <section className="statistics-page">
    <header className="statistics-heading"><p className="eyebrow"><span className="eyebrow-dot" /> BRAINSTORM · ANALYSIS</p><h1>{t('stats.title')}</h1><p>{t('stats.description')}</p></header>
    <div className="statistics-metrics">{metrics.map(([label, value, note]) => <article className="statistics-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
    <div className="statistics-panels">
      <section className="statistics-panel"><div className="statistics-panel-heading"><div><p className="section-label">{t('stats.recent')}</p><h2>{t('stats.lastWeek')}</h2></div><span>{t('stats.completed')}</span></div>
        {results.length ? <div className="weekly-chart" role="img" aria-label={t('stats.lastWeek')}>{days.map(day => <div className="weekly-chart-day" key={localDateKey(day.date)}><span className="weekly-chart-count">{day.count || ''}</span><div className="weekly-chart-track"><i style={{ height: `${day.count ? Math.max(10, Math.min(100, day.count * 22)) : 3}%` }} /></div><small>{dateLabel(day.date,language)}</small></div>)}</div> : <p className="statistics-empty">{t('stats.noData')}</p>}
      </section>
      <section className="statistics-panel"><div className="statistics-panel-heading"><div><p className="section-label">{t('stats.brainAreas')}</p><h2>{t('stats.brainAreas')}</h2></div></div>
        {categoryStats.length ? <div className="category-performance">{categoryStats.map(item => <div className="category-performance-row" key={item.category}><div><strong>{t(`area.${item.category.toLowerCase()}`)}</strong><span>{item.count} {language==='en'?'games · avg.':'oyun · ort.'} {item.score}</span></div><i style={{ width: `${Math.max(4, Math.min(100, item.score / Math.max(summary.avgScore || item.score, 1) * 100))}%` }} /></div>)}</div> : <p className="statistics-empty">{t('stats.noData')}</p>}
      </section>
    </div>
    <section className="statistics-panel recent-results"><div className="statistics-panel-heading"><div><p className="section-label">{t('stats.history')}</p><h2>{t('stats.recent')}</h2></div><span>{results.length} {t('stats.sessions')}</span></div>
      {recent.length ? <div className="results-table-wrap"><table className="results-table"><thead><tr>{(language==='en'?['Game','Area','Score','Accuracy','Time','Date']:['Oyun','Alan','Skor','Doğruluk','Süre','Tarih']).map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{recent.map(result => <tr key={result.sessionId}><td>{result.gameName}</td><td>{t(`area.${categoryName(result.gameId).toLowerCase()}`)}</td><td>{result.score}</td><td>{Number.isFinite(result.accuracy) ? `${result.accuracy}%` : '—'}</td><td>{result.duration} {language==='en'?'sec':'sn'}</td><td>{new Intl.DateTimeFormat(language==='tr'?'tr-TR':'en', { dateStyle: 'medium' }).format(new Date(result.timestamp))}</td></tr>)}</tbody></table></div> : <p className="statistics-empty">{t('stats.noData')}</p>}
    </section>
  </section>
}

export default Statistics
