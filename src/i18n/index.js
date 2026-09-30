import en from './en.js'
import tr from './tr.js'

export const dictionaries = { en, tr }
export const languageKey = 'brainstorm-language'
export const supportedLanguages = ['tr', 'en']

const gameLabels = {
  memory: ['Memory', 'Match the hidden pairs before the board changes.', 'Hafıza', 'Kartları eşleştir ve konumlarını aklında tut.'],
  reaction: ['Reaction', 'Read the signal and strike at the right moment.', 'Hız', 'Sinyali gör ve doğru anda tepki ver.'],
  oddOneOut: ['Odd One Out', 'Find the symbol that breaks the pattern.', 'Dikkat', 'Örüntüyü bozan sembolü bul.'],
  patternLogic: ['Pattern Logic', 'Read the sequence and uncover what comes next.', 'Mantık', 'Diziyi çöz ve sıradaki şekli bul.'],
  mathRush: ['Math Rush', 'Solve quick-fire number challenges.', 'Mantık', 'Sayı problemlerini çöz.'],
  numberSequence: ['Number Sequence', 'Observe a number pattern, then repeat it.', 'Hafıza', 'Sayı dizisini gör ve tekrar et.'],
  stroop: ['Stroop Challenge', 'Focus on the ink, not the word.', 'Dikkat', 'Kelimeye değil, yazı rengine odaklan.'],
  numberMemory: ['Number Memory', 'Hold a changing number string in memory.', 'Hafıza', 'Sayı dizisini aklında tut.'],
  taskSwitch: ['Task Switch', 'Adapt when the rules change mid-run.', 'Esneklik', 'Kurallar değiştikçe uyum sağla.'],
  visualSearch: ['Visual Search', 'Pick the target out of a crowded field.', 'Dikkat', 'Hedefi kalabalık sembollerin arasından bul.'],
  memoryMatrix: ['Memory Matrix', 'Remember which cells lit up.', 'Hafıza', 'Yanan hücreleri aklında tut.'],
  sequenceRecall: ['Sequence Recall', 'Repeat the signal in its original order.', 'Hafıza', 'Sinyal sırasını tekrar et.'],
  speedMatch: ['Speed Match', 'Decide whether the two signals match.', 'Hız', 'İki sinyalin aynı olup olmadığını bul.'],
  quickSort: ['Quick Sort', 'Sort each object by the active rule.', 'Dikkat', 'Nesneleri geçerli kurala göre ayır.'],
  multiTrack: ['Multi Track', 'Keep your eyes on the moving targets.', 'Hafıza', 'Hareketli hedefleri takip et.'],
  gridPath: ['Grid Path', 'Find a route through gates and obstacles.', 'Mantık', 'Kapı ve engellerin arasından bir rota bul.'],
  'tower-of-hanoi': ['Tower of Hanoi', 'Move the stack while respecting each rule.', 'Mantık', 'Diskleri kurallara uyarak taşı.'],
  mastermind: ['Mastermind Logic', 'Use the clues to crack the hidden code.', 'Mantık', 'İpuçlarından gizli kodu çöz.'],
  'deduction-grid': ['Deduction Grid', 'Connect the clues to solve the case.', 'Mantık', 'İpuçlarını birleştirip vakayı çöz.'],
  'bomb-defusal': ['Bomb Defusal', 'Read the modules and disarm the device.', 'Mantık', 'Modülleri çöz ve düzeneği etkisizleştir.'],
  'memory-heist': ['Memory Heist', 'Remember the map, take the key, find the exit.', 'Hafıza', 'Haritayı aklında tut, anahtarı al ve çıkışı bul.'],
  'safe-cracker': ['Safe Cracker', 'Turn the clues into the combination.', 'Mantık', 'İpuçlarını kasa şifresine dönüştür.'],
  'courier-rush': ['Courier Rush', 'Plan deliveries across a shifting route.', 'Mantık', 'Değişen rotada teslimatları planla.'],
  'signal-rush': ['Signal Rush', 'Follow the active cue and build a streak.', 'Dikkat', 'Etkin sinyali izle ve serini koru.'],
  'pattern-forge': ['Pattern Forge', 'Apply shape, color and direction rules.', 'Mantık', 'Şekil, renk ve yön kurallarını uygula.'],
  'memory-market': ['Memory Market', 'Recall products, prices and shelf positions.', 'Hafıza', 'Ürünleri, fiyatları ve raf konumlarını hatırla.'],
  'traffic-control': ['Traffic Control', 'Manage the crossing and keep traffic moving.', 'Dikkat', 'Kavşağı yönet ve trafiği akıcı tut.'],
  'word-snap': ['Word Snap', 'Track the category and catch the right word.', 'Dikkat', 'Kategoriyi izle ve doğru kelimeyi yakala.'],
  'resource-rush': ['Resource Rush', 'Balance time, energy and credits.', 'Mantık', 'Zaman, enerji ve kredileri dengele.'],
  'the-last-clue': ['The Last Clue', 'Link the timeline and solve the case.', 'Mantık', 'Zaman çizgisini birleştir ve vakayı çöz.'],
}

export function gameText(game, language = 'tr') {
  const [englishName, englishDescription, turkishCategory, turkishDescription] = gameLabels[game.id] || [game.name, game.description, game.category, game.description]
  return {
    ...game,
    name: language === 'en' ? englishName : game.name,
    title: language === 'en' ? englishName : game.name,
    description: language === 'en' ? englishDescription : turkishDescription,
    category: language === 'en' ? (game.category === 'Hafıza' ? 'Memory' : game.category === 'Hız' ? 'Speed' : game.category === 'Dikkat' ? 'Attention' : game.category === 'Mantık' || game.category === 'Problem Solving' ? 'Logic' : game.category === 'Esneklik' ? 'Flexibility' : game.category) : turkishCategory,
  }
}
