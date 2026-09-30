import AlienMascot from './AlienMascot.jsx'

function Brand({ compact = false }) {
  return <span className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
    <span className="brand-symbol"><AlienMascot compact label="BRAINSTORM brain-energy symbol" /></span>
    <span className="brand-wordmark">BRAIN<span>STORM</span></span>
  </span>
}
export default Brand
