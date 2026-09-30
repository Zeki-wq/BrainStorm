import { useCallback, useEffect, useRef, useState } from 'react'
import AlienMascot from './AlienMascot.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { playIntroLightning, unlockAudio } from '../utils/audioManager.js'

const particles = [
  [7, 24, 0], [13, 72, 180], [21, 12, 80], [27, 86, 260], [34, 31, 120], [42, 8, 350],
  [58, 91, 230], [66, 18, 60], [73, 77, 290], [82, 29, 150], [91, 61, 40], [96, 17, 320],
  [18, 44, 300], [84, 89, 200], [53, 13, 100], [6, 83, 240], [94, 39, 20], [37, 94, 170],
]

function IntroAnimation({ onComplete, reducedMotion = false }) {
  const { t } = useI18n()
  const [stage, setStage] = useState(0)
  const isReadyToEnter = useRef(false)
  const entryQueued = useRef(false)
  const entering = useRef(false)
  const exitTimer = useRef(null)
  const signals = [t('intro.initializing'), t('intro.scanning'), t('intro.online')]

  const startExit = useCallback(() => {
    if (entering.current) return
    entering.current = true
    playIntroLightning()
    setStage(6)
    exitTimer.current = window.setTimeout(onComplete, reducedMotion ? 650 : 800)
  }, [onComplete, reducedMotion])

  useEffect(() => {
    const markReady = () => {
      isReadyToEnter.current = true
      setStage(5)
      if (entryQueued.current) startExit()
    }
    const timers = reducedMotion
      ? [window.setTimeout(() => setStage(3), 100), window.setTimeout(() => setStage(4), 300), window.setTimeout(markReady, 500)]
      : [
          window.setTimeout(() => setStage(1), 450),
          window.setTimeout(() => setStage(2), 1000),
          window.setTimeout(() => setStage(3), 1500),
          window.setTimeout(() => setStage(4), 2200),
          window.setTimeout(markReady, 2600),
        ]
    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(exitTimer.current)
    }
  }, [reducedMotion, startExit])

  function enter() {
    unlockAudio()
    if (!isReadyToEnter.current) {
      entryQueued.current = true
      return
    }
    startExit()
  }

  return <div className="brainstorm-intro" data-stage={stage} data-reduced-motion={reducedMotion} role="region" aria-label="BRAINSTORM intro">
    <div className="intro-seq-grid" aria-hidden="true" />
    <button className="intro-enter-surface" type="button" aria-label="CLICK TO ENTER" onClick={enter} />
    <div className="intro-seq-particles" aria-hidden="true">{particles.map(([x, y, delay], index) => <i key={index} style={{ '--px': `${x}%`, '--py': `${y}%`, '--pd': `${delay}ms` }} />)}</div>
    <svg className="intro-seq-bolts" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path className="intro-seq-bolt bolt-left" d="M-30 355 72 338 118 360 177 330 230 353 281 337 340 369 411 348 463 370 534 355 589 379" />
      <path className="intro-seq-bolt bolt-right" d="M1230 408 1131 389 1086 415 1021 385 968 411 913 393 854 427 796 407 735 430 676 411 610 435" />
      <path className="intro-seq-bolt bolt-top" d="M581 -30 601 66 574 119 610 172 584 229 615 282 590 337 622 390" />
      <path className="intro-seq-bolt bolt-bottom" d="M640 830 621 736 650 683 616 627 645 575 612 521 638 466 604 414" />
      <path className="intro-seq-bolt bolt-cross" d="M198 128 294 175 337 158 386 216 433 203 478 263 527 250 579 307 621 295 676 350 723 337 776 389 828 372 883 422 943 403 1006 455" />
      <path className="intro-seq-bolt bolt-cross bolt-cross-two" d="M1010 128 916 178 868 158 821 218 770 202 727 261 675 246 625 301 579 287 525 345 478 330 425 384 372 367 318 419 261 399 198 451" />
      <circle className="intro-seq-impact" cx="600" cy="400" r="12" />
    </svg>
    <div className="intro-seq-mascot"><AlienMascot label="BRAINSTORM alien mascot" /></div>
    <div className="intro-seq-logo"><span className="intro-seq-mark"><AlienMascot compact label="BRAINSTORM symbol" /></span><span className="intro-seq-word" aria-label="BRAINSTORM">{'BRAINSTORM'.split('').map((letter, index) => <i key={`${letter}-${index}`} style={{ '--letter-index': index }}>{letter}</i>)}</span></div>
    <p className="intro-seq-tagline">TRAIN YOUR MIND.</p>
    <div className="intro-seq-readout"><span className="intro-seq-live" />{signals[stage >= 4 ? 2 : stage >= 2 ? 1 : 0]}<i> / 03</i></div>
    <div className="intro-seq-progress" aria-hidden="true"><i /></div>
    <div className="intro-seq-enter" aria-hidden="true"><span className="intro-enter-mark">[</span> CLICK TO ENTER <span className="intro-enter-arrow">-&gt;</span> <span className="intro-enter-mark">]</span></div>
    <div className="intro-seq-flash" aria-hidden="true" />
    <span className="intro-seq-coordinate intro-seq-coordinate-a" aria-hidden="true">BL-01 // 37.7749</span>
    <span className="intro-seq-coordinate intro-seq-coordinate-b" aria-hidden="true">NEURAL LINK ESTABLISHED</span>
  </div>
}

export default IntroAnimation
