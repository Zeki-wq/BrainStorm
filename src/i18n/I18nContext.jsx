import { createContext, useContext } from 'react'
import { dictionaries } from './index.js'

export const I18nContext = createContext({ language: 'tr', setLanguage: () => {}, t: key => dictionaries.tr[key] || key })
export const useI18n = () => useContext(I18nContext)
