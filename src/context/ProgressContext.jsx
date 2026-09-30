import { createContext, useContext } from 'react'

export const ProgressContext = createContext({
  results: [], progress: { currentStreak: 0, longestStreak: 0, lastActivityDate: null, totalTrainingDays: 0 },
  dailyGoal: 3, recordGameResult: () => {}, resetStats: () => {}, resetAllProgress: () => {},
})
export const useProgress = () => useContext(ProgressContext)
