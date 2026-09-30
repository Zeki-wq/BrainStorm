function AlienMascot({ className = '', compact = false, label = 'BRAINSTORM alien mascot' }) {
  return <svg className={`alien-mascot ${compact ? 'alien-mascot-compact' : ''} ${className}`} viewBox="0 0 280 300" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="brainSkin" cx="38%" cy="28%" r="75%"><stop stopColor="#788d61"/><stop offset=".58" stopColor="#46583d"/><stop offset="1" stopColor="#263528"/></radialGradient>
      <linearGradient id="bodySuit" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#53664a"/><stop offset="1" stopColor="#253329"/></linearGradient>
      <radialGradient id="eyeGlow"><stop stopColor="#d6e3bd"/><stop offset=".66" stopColor="#9bb87c"/><stop offset="1" stopColor="#587052"/></radialGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <ellipse cx="140" cy="278" rx="70" ry="9" fill="#09100b" opacity=".65"/>
    <ellipse className="alien-aura" cx="140" cy="123" rx="100" ry="96" fill="#617a4e" opacity=".12" filter="url(#softGlow)"/>
    <g className="alien-float">
      <path d="M101 222 91 251q-2 13 10 14h21l9-34m34-9 11 29q4 12 15 9l15-7q8-5 1-14l-23-31" fill="url(#bodySuit)" stroke="#87936e" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M101 171q-22 14-20 45l11 20q10 13 48 14 39-1 50-15l9-22q-1-24-20-41z" fill="url(#bodySuit)" stroke="#8c9a70" strokeWidth="3"/>
      <path d="m105 182 35 20 34-20 11 28-45 25-47-25z" fill="#18241d" stroke="#73875b" strokeWidth="2"/>
      <path d="M124 204h32l-6 17h-20z" fill="#83945e" opacity=".85"/><circle cx="140" cy="211" r="5" fill="#d4d8a0"/>
      <path d="M83 184 63 207q-6 8 2 14l8 4q7 3 12-5l13-19m99-17 18 23q7 8 0 15l-8 4q-8 2-12-6l-12-17" fill="#394a37" stroke="#83916b" strokeWidth="3"/>
      <path d="M117 258v16m45-17 5 17" stroke="#788865" strokeWidth="8" strokeLinecap="round"/><path d="M103 273h25m35 0h27" stroke="#1d2a21" strokeWidth="9" strokeLinecap="round"/>
      <path d="M140 29c-31 0-57 21-63 50-3 17 2 34 12 46-8 13-5 28 7 36 12 9 29 11 44 11s32-2 44-11c12-8 15-23 7-36 10-12 15-29 12-46-6-29-32-50-63-50Z" fill="url(#brainSkin)" stroke="#a4ad83" strokeWidth="3"/>
      <path d="M103 70c-13-14-1-29 13-24 11-18 28-13 30 1 15-11 29-1 22 13 15 2 17 18 5 25m-68 28c-13-7-12-22 1-27m16-26c9 3 13 13 8 21m24-14c-8 7-8 17 0 22m17 20c12-9 10-22 0-27m-74-3c9 4 13 12 10 21m57-56c-9 3-12 11-8 19" fill="none" stroke="#a3b18a" strokeWidth="3" strokeLinecap="round" opacity=".68"/>
      <path d="M89 105q21-20 42 1v27q-20 14-41-1zM149 106q21-21 42-1v27q-20 15-41 1z" fill="#17221b" stroke="#788c64" strokeWidth="2"/>
      <g className="alien-eyes"><ellipse cx="111" cy="118" rx="13" ry="16" fill="url(#eyeGlow)"/><ellipse cx="168" cy="118" rx="13" ry="16" fill="url(#eyeGlow)"/><ellipse cx="114" cy="120" rx="5" ry="10" fill="#111b14"/><ellipse cx="165" cy="120" rx="5" ry="10" fill="#111b14"/><circle cx="116" cy="115" r="3" fill="#eef1d9"/><circle cx="167" cy="115" r="3" fill="#eef1d9"/></g>
      <path d="M128 145q12 8 24 0" fill="none" stroke="#c0c79d" strokeWidth="2.5" strokeLinecap="round"/><path d="M81 84 68 76m131 8 13-8" stroke="#9ba783" strokeWidth="3" strokeLinecap="round"/><circle cx="65" cy="75" r="4" fill="#a9b88d"/><circle cx="215" cy="75" r="4" fill="#a9b88d"/>
      <path d="M140 25v-9m0 0-8-7m8 7 8-7" stroke="#a9b88d" strokeWidth="2" strokeLinecap="round"/><circle cx="140" cy="9" r="4" fill="#c0c99d"/>
    </g>
  </svg>
}
export default AlienMascot
