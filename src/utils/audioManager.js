const defaults = { masterVolume: 100, musicEnabled: true, musicVolume: 40, sfxEnabled: true, sfxVolume: 70 }
const legacyTracks = {
  default: [196, 247, 294, 247],
  puzzle: [164.81, 196, 246.94, 196],
  'memory-heist': [130.81, 155.56, 174.61, 155.56],
  'bomb-defusal': [110, 130.81, 146.83, 123.47],
  'courier-rush': [220, 261.63, 329.63, 293.66],
}
const menuMelody = [659.25, 0, 987.77, 783.99, 1046.5, 0, 783.99, 659.25, 587.33, 0, 880, 1174.66, 1046.5, 880, 783.99, 0]
const menuBass = [82.41, 82.41, 110, 110, 73.42, 73.42, 98, 98]
const tones = {
  click: [620, 0.045, 'sine'], correct: [740, 0.12, 'sine'], wrong: [145, 0.2, 'triangle'],
  countdown: [420, 0.09, 'square'], combo: [880, 0.17, 'sine'], levelComplete: [990, 0.24, 'triangle'],
  gameOver: [95, 0.34, 'sawtooth'], warning: [330, 0.22, 'square'], pickup: [820, 0.1, 'sine'],
  unlock: [660, 0.3, 'triangle'], explosion: [70, 0.36, 'sawtooth'], movement: [250, 0.035, 'sine'], delivery: [880, 0.18, 'triangle'], traffic: [210, 0.12, 'square'],
  signal: [510, 0.08, 'sine'], marketReveal: [390, 0.13, 'triangle'], marketSelect: [580, 0.07, 'sine'], car: [245, 0.1, 'triangle'], wordAppear: [460, 0.06, 'sine'], decision: [340, 0.1, 'triangle'], clue: [690, 0.12, 'sine'],
}

let context
let masterBus
let sfxBus
let musicBus
let settings = { ...defaults }
let musicTimer
let currentTrack = null
let desiredTrack = null
let trackIndex = 0
let lastPlayed = new Map()
let noiseBuffer
let introLightningAudio
const activeMusicSources = new Set()

function canPlaySfx() {
  return settings.sfxEnabled && settings.sfxVolume > 0 && settings.masterVolume > 0
}

function introLightningVolume() {
  return (settings.masterVolume / 100) * (settings.sfxVolume / 100)
}

function getIntroLightningAudio() {
  if (typeof Audio === 'undefined') return null
  if (!introLightningAudio) {
    introLightningAudio = new Audio('/assets/intro-lightning.mp3')
    introLightningAudio.preload = 'auto'
  }
  introLightningAudio.volume = introLightningVolume()
  return introLightningAudio
}

function ensureContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!context) {
    context = new AudioContextClass()
    masterBus = context.createGain()
    sfxBus = context.createGain()
    musicBus = context.createGain()
    sfxBus.connect(masterBus)
    musicBus.connect(masterBus)
    masterBus.connect(context.destination)
  }
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

export function unlockAudio() { ensureContext() }

function applyVolumes(smooth = true) {
  if (!context) return
  const now = context.currentTime
  const setGain = (node, value, timeConstant) => {
    if (smooth) node.gain.setTargetAtTime(value, now, timeConstant)
    else node.gain.setValueAtTime(value, now)
  }
  setGain(masterBus, settings.masterVolume / 100, 0.035)
  setGain(sfxBus, settings.sfxEnabled ? settings.sfxVolume / 100 : 0, 0.025)
  setGain(musicBus, settings.musicEnabled ? settings.musicVolume / 100 : 0, 0.06)
}

export function configureAudio(next = {}) {
  settings = { ...settings, ...next }
  applyVolumes()
  if (introLightningAudio) {
    introLightningAudio.volume = introLightningVolume()
    if (!canPlaySfx()) {
      introLightningAudio.pause()
      introLightningAudio.currentTime = 0
    }
  }
  if (!settings.musicEnabled || settings.musicVolume <= 0 || settings.masterVolume <= 0) stopMusic(false)
  else if (desiredTrack) playMusic(desiredTrack)
}

function playLightning(audio) {
  const now = audio.currentTime + 0.008
  const noise = audio.createBufferSource()
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.36), audio.sampleRate)
    const samples = noiseBuffer.getChannelData(0)
    for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 0.55
  }
  noise.buffer = noiseBuffer
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(4200, now)
  filter.frequency.exponentialRampToValueAtTime(230, now + 0.3)
  const crack = audio.createGain()
  crack.gain.setValueAtTime(0.0001, now)
  crack.gain.exponentialRampToValueAtTime(0.65, now + 0.009)
  crack.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
  noise.connect(filter)
  filter.connect(crack)
  crack.connect(sfxBus)
  noise.start(now)
  noise.stop(now + 0.34)

  const zap = audio.createOscillator()
  const zapEnvelope = audio.createGain()
  zap.type = 'sawtooth'
  zap.frequency.setValueAtTime(1900, now)
  zap.frequency.exponentialRampToValueAtTime(145, now + 0.16)
  zapEnvelope.gain.setValueAtTime(0.0001, now)
  zapEnvelope.gain.exponentialRampToValueAtTime(0.34, now + 0.006)
  zapEnvelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.17)
  zap.connect(zapEnvelope)
  zapEnvelope.connect(sfxBus)
  zap.start(now)
  zap.stop(now + 0.19)
  zap.onended = () => { zap.disconnect(); zapEnvelope.disconnect() }

  const bass = audio.createOscillator()
  const bassEnvelope = audio.createGain()
  bass.type = 'triangle'
  bass.frequency.setValueAtTime(118, now)
  bass.frequency.exponentialRampToValueAtTime(38, now + 0.2)
  bassEnvelope.gain.setValueAtTime(0.0001, now)
  bassEnvelope.gain.exponentialRampToValueAtTime(0.48, now + 0.008)
  bassEnvelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  bass.connect(bassEnvelope)
  bassEnvelope.connect(sfxBus)
  bass.start(now)
  bass.stop(now + 0.24)
  bass.onended = () => { bass.disconnect(); bassEnvelope.disconnect() }
}

export function playSfx(name = 'click') {
  if (!canPlaySfx()) return
  const nowMs = Date.now()
  if (nowMs - (lastPlayed.get(name) || 0) < 45) return
  lastPlayed.set(name, nowMs)
  const audio = ensureContext()
  if (!audio) return
  applyVolumes()
  if (name === 'lightning') { playLightning(audio); return }
  const [frequency, duration, type] = tones[name] || tones.click
  const oscillator = audio.createOscillator()
  const envelope = audio.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
  if (name === 'explosion') oscillator.frequency.exponentialRampToValueAtTime(35, audio.currentTime + duration)
  envelope.gain.setValueAtTime(0.0001, audio.currentTime)
  envelope.gain.exponentialRampToValueAtTime(0.22, audio.currentTime + 0.012)
  envelope.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  oscillator.connect(envelope)
  envelope.connect(sfxBus)
  oscillator.start()
  oscillator.stop(audio.currentTime + duration + 0.02)
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
}

export function playIntroLightning() {
  if (!canPlaySfx()) return
  const lightning = getIntroLightningAudio()
  if (!lightning) {
    playSfx('lightning')
    return
  }
  lightning.currentTime = 0
  lightning.play().catch(() => {
    // Keep the transition audible when the optional media asset is unavailable.
    playSfx('lightning')
  })
}

function scheduleTone(frequency, type, duration, volume, when = context.currentTime + 0.008) {
  if (!frequency) return
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, when)
  envelope.gain.setValueAtTime(0.0001, when)
  envelope.gain.exponentialRampToValueAtTime(volume, when + 0.008)
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  oscillator.connect(envelope)
  envelope.connect(musicBus)
  activeMusicSources.add(oscillator)
  oscillator.start(when)
  oscillator.stop(when + duration + 0.015)
  oscillator.onended = () => { activeMusicSources.delete(oscillator); oscillator.disconnect(); envelope.disconnect() }
}

function scheduleDrum(kind, when) {
  if (kind === 'kick') {
    const osc = context.createOscillator()
    const env = context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(145, when)
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.11)
    env.gain.setValueAtTime(0.26, when)
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.13)
    osc.connect(env); env.connect(musicBus); osc.start(when); osc.stop(when + 0.14)
    osc.onended = () => { osc.disconnect(); env.disconnect() }
    return
  }
  const source = context.createBufferSource()
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.36), context.sampleRate)
    const samples = noiseBuffer.getChannelData(0)
    for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 0.55
  }
  source.buffer = noiseBuffer
  const filter = context.createBiquadFilter()
  filter.type = kind === 'snare' ? 'bandpass' : 'highpass'
  filter.frequency.value = kind === 'snare' ? 1900 : 7000
  const env = context.createGain()
  const duration = kind === 'snare' ? 0.085 : 0.035
  env.gain.setValueAtTime(kind === 'snare' ? 0.105 : 0.045, when)
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  source.connect(filter); filter.connect(env); env.connect(musicBus); source.start(when); source.stop(when + duration + 0.01)
  source.onended = () => { source.disconnect(); filter.disconnect(); env.disconnect() }
}

function playMusicStep() {
  if (!context || !currentTrack || !settings.musicEnabled || settings.musicVolume <= 0 || settings.masterVolume <= 0) return
  if (currentTrack === 'menu') {
    const step = trackIndex % menuMelody.length
    const now = context.currentTime + 0.012
    scheduleTone(menuMelody[step], 'square', 0.115, 0.16, now)
    if (step % 2 === 0) scheduleTone(menuBass[Math.floor(step / 2)], 'triangle', 0.19, 0.22, now)
    if (step % 4 === 0) scheduleDrum('kick', now)
    else if (step % 4 === 2) scheduleDrum('hat', now)
    else if (step % 8 === 7) scheduleDrum('snare', now)
    trackIndex += 1
    return
  }
  const notes = legacyTracks[currentTrack] || legacyTracks.default
  scheduleTone(notes[trackIndex % notes.length] / 2, 'sine', 1.05, 0.12)
  trackIndex += 1
}

export function playMusic(name = 'default') {
  desiredTrack = name
  if (!settings.musicEnabled || settings.musicVolume <= 0 || settings.masterVolume <= 0) return
  if (currentTrack === name && musicTimer) return
  stopMusic()
  const audio = ensureContext()
  if (!audio) return
  currentTrack = name
  trackIndex = 0
  applyVolumes(false)
  if (name === 'menu') {
    musicBus.gain.cancelScheduledValues(audio.currentTime)
    musicBus.gain.setValueAtTime(0, audio.currentTime)
    musicBus.gain.linearRampToValueAtTime(settings.musicVolume / 100, audio.currentTime + 0.35)
  }
  playMusicStep()
  musicTimer = window.setInterval(playMusicStep, name === 'menu' ? 150 : 1200)
}

export function startMenuMusic() {
  desiredTrack = 'menu'
  if (!settings.musicEnabled || settings.musicVolume <= 0 || settings.masterVolume <= 0 || currentTrack === 'menu') return
  playMusic('menu')
}

export function stopMusic(clearPreference = true) {
  if (musicTimer) window.clearInterval(musicTimer)
  musicTimer = undefined
  activeMusicSources.forEach(source => { try { source.stop() } catch { /* Already ended. */ } })
  activeMusicSources.clear()
  currentTrack = null
  if (clearPreference) desiredTrack = null
}

export function setMasterVolume(volume) { configureAudio({ masterVolume: Math.min(100, Math.max(0, Number(volume) || 0)) }) }
export function setMusicVolume(volume) { configureAudio({ musicVolume: Math.min(100, Math.max(0, Number(volume) || 0)) }) }
export function setSfxVolume(volume) { configureAudio({ sfxVolume: Math.min(100, Math.max(0, Number(volume) || 0)) }) }
export function toggleMusic() { configureAudio({ musicEnabled: !settings.musicEnabled }) }
export function toggleSfx() { configureAudio({ sfxEnabled: !settings.sfxEnabled }) }
