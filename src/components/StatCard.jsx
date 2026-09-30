const iconSymbols = { Hafıza: '◉', Dikkat: '◎', Hız: '↗', Mantık: '✳' }

function StatCard({ title, score, change, color }) {
  return <article className="stat-card" style={{ '--card-accent': color }}>
    <div className="stat-card-top"><span className="stat-icon" aria-hidden="true">{iconSymbols[title]}</span><span className="stat-change">↗ {change}</span></div>
    <p className="stat-title">{title}</p><div className="stat-score">{score}<span> / 100</span></div>
    <div className="stat-track" role="img" aria-label={`${title}: ${score} / 100`}><span style={{ width: `${score}%` }} /></div>
  </article>
}

export default StatCard
