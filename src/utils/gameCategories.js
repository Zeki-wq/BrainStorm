export const gameCategory = Object.freeze({
  memory: 'Memory', numberMemory: 'Memory', numberSequence: 'Memory', memoryMatrix: 'Memory', sequenceRecall: 'Memory', multiTrack: 'Memory', 'memory-heist': 'Memory',
  reaction: 'Speed', speedMatch: 'Speed',
  oddOneOut: 'Attention', visualSearch: 'Attention', stroop: 'Attention', taskSwitch: 'Flexibility', quickSort: 'Attention',
  mathRush: 'Math', patternLogic: 'Logic', mastermind: 'Logic', 'deduction-grid': 'Logic', 'safe-cracker': 'Logic', 'bomb-defusal': 'Logic',
  gridPath: 'Problem Solving', 'tower-of-hanoi': 'Problem Solving', 'courier-rush': 'Problem Solving',
  'signal-rush': 'Attention', 'memory-market': 'Memory', 'traffic-control': 'Attention',
  'word-snap': 'Language', 'resource-rush': 'Planning', 'the-last-clue': 'Problem Solving', 'pattern-forge': 'Logic',
})

export const categories = ['Memory', 'Attention', 'Speed', 'Logic', 'Flexibility']
const categoryAliases = {
  'Problem Solving': 'Logic', Problem: 'Logic', Planning: 'Logic', Math: 'Logic', 'Language': 'Attention',
  Other: 'Logic',
}
export const getGameCategory = game => {
  const category = gameCategory[game.id] || game.category || 'Logic'
  return categoryAliases[category] || category
}


