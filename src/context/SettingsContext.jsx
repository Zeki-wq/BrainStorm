import { createContext, useContext } from 'react'
import { safeRead, STORAGE_KEYS } from '../utils/storage.js'

export const SETTINGS_KEY = STORAGE_KEYS.settings
export const defaultSettings = {
  masterVolume: 100,
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 45,
  sfxVolume: 65,
  reducedAnimations: false,
  showIntroAnimation: true,
  theme: 'system',
}

export function loadSettings() {
  const saved = safeRead(SETTINGS_KEY, {})
  const value = saved && typeof saved === 'object' ? saved : {}
  return {
    ...defaultSettings,
    ...value,
    sfxEnabled: typeof value.sfxEnabled === 'boolean' ? value.sfxEnabled : defaultSettings.sfxEnabled,
    musicEnabled: typeof value.musicEnabled === 'boolean' ? value.musicEnabled : defaultSettings.musicEnabled,
    reducedAnimations: typeof value.reducedAnimations === 'boolean' ? value.reducedAnimations : defaultSettings.reducedAnimations,
    showIntroAnimation: typeof value.showIntroAnimation === 'boolean' ? value.showIntroAnimation : defaultSettings.showIntroAnimation,
    masterVolume: Number.isFinite(value.masterVolume) ? Math.min(100, Math.max(0, value.masterVolume)) : defaultSettings.masterVolume,
    musicVolume: Number.isFinite(value.musicVolume) ? Math.min(100, Math.max(0, value.musicVolume)) : defaultSettings.musicVolume,
    sfxVolume: Number.isFinite(value.sfxVolume) ? Math.min(100, Math.max(0, value.sfxVolume)) : defaultSettings.sfxVolume,
    theme: ['dark', 'light', 'system'].includes(value.theme) ? value.theme : defaultSettings.theme,
  }
}

export const SettingsContext = createContext({ settings: defaultSettings, updateSettings: () => {}, resetSettings: () => {}, dailyGoal: 3, setDailyGoal: () => {}, resetStats: () => {}, resetAllProgress: () => {}, results: [], progress: {} })
export const useSettings = () => useContext(SettingsContext)
