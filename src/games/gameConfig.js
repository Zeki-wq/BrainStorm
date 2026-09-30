import { gameCategory } from '../utils/gameCategories.js'

const entries = [
  { id: 'memory', name: 'Memory', category: 'Hafıza', description: 'Hafıza kapasiteni zorla ve desenleri aklında tut.', difficulty: 'Kolay' },
  { id: 'reaction', name: 'Reaction', category: 'Hız', description: 'Görsel ipuçlarına ne kadar hızlı tepki verebildiğini keşfet.', difficulty: 'Orta' },
  { id: 'oddOneOut', name: 'Odd One Out', category: 'Dikkat', description: 'Diğerlerinden farklı sembolü mümkün olduğunca hızlı bul.', difficulty: 'Kolay' },
  { id: 'patternLogic', name: 'Pattern Logic', category: 'Mantık', description: 'Örüntüleri çöz ve sıradaki adımı bul.', difficulty: 'Orta' },
  { id: 'mathRush', name: 'Math Rush', category: 'Mantık', description: 'Kısa sürede zihinden işlem yapma becerini çalıştır.', difficulty: 'Zor' },
  { id: 'numberSequence', name: 'Number Sequence', category: 'Hafıza', description: 'Sayı dizisini aklında tut ve doğru sırayla tekrar gir.', difficulty: 'Orta' },
  { id: 'stroop', name: 'Stroop Challenge', category: 'Dikkat', description: 'Kelimenin anlamına değil, yazı rengine odaklan.', difficulty: 'Orta' },
  { id: 'numberMemory', name: 'Number Memory', category: 'Hafıza', description: 'Kısa süre gördüğün sayı dizisini aklında tut.', difficulty: 'Orta' },
  { id: 'taskSwitch', name: 'Task Switch', category: 'Dikkat', description: 'Değişen kurallara hızla uyum sağla.', difficulty: 'Zor' },
  { id: 'visualSearch', name: 'Visual Search', category: 'Dikkat', description: 'Kalabalık semboller içinde hedefi bul.', difficulty: 'Orta' },
  { id: 'memoryMatrix', name: 'Memory Matrix', category: 'Hafıza', description: 'Parlayan hücrelerin yerlerini hatırla.', difficulty: 'Orta' },
  { id: 'sequenceRecall', name: 'Sequence Recall', category: 'Hafıza', description: 'Işıkların yandığı sırayı tekrar et.', difficulty: 'Orta' },
  { id: 'speedMatch', name: 'Speed Match', category: 'Hız', description: 'İki sembolün aynı mı farklı mı olduğunu bul.', difficulty: 'Orta' },
  { id: 'quickSort', name: 'Quick Sort', category: 'Dikkat', description: 'Nesneleri değişen kurallarla doğru kutulara ayır.', difficulty: 'Orta' },
  { id: 'multiTrack', name: 'Multi Track', category: 'Hafıza', description: 'Hareket eden hedefi kalabalıkta takip et.', difficulty: 'Zor' },
  { id: 'gridPath', name: 'Grid Path', category: 'Problem Solving', description: 'Engeller, anahtarlar ve kapılarla dolu rotayı çöz.', difficulty: 'Zor' },
  { id: 'tower-of-hanoi', name: 'Tower of Hanoi', category: 'Problem Solving', description: 'Diskleri kurallara uyarak en az hamlede taşı.', difficulty: 'Zor' },
  { id: 'mastermind', name: 'Mastermind Logic', category: 'Logic', description: 'Renk ipuçlarını kullanarak gizli kodu çöz.', difficulty: 'Zor' },
  { id: 'deduction-grid', name: 'Deduction Grid', category: 'Logic', description: 'İpuçlarından kişi, renk, hayvan ve şehir eşleşmelerini çıkar.', difficulty: 'Zor' },
  { id: 'bomb-defusal', name: 'Bomb Defusal', category: 'Logic', description: 'Zamana karşı modül bulmacalarını çöz ve cihazı etkisizleştir.', difficulty: 'Orta' },
  { id: 'memory-heist', name: 'Memory Heist', category: 'Hafıza', description: 'Haritayı aklında tut, anahtarı al ve çıkışa kaç.', difficulty: 'Zor' },
  { id: 'safe-cracker', name: 'Safe Cracker', category: 'Logic', description: 'Doğal dildeki ipuçlarından kasa şifresini çıkar.', difficulty: 'Zor' },
  { id: 'courier-rush', name: 'Courier Rush', category: 'Problem Solving', description: 'Teslimatları kısıtlar ve yol maliyetleriyle planla.', difficulty: 'Zor' },
  { id: 'signal-rush', name: 'Signal Rush', category: 'Attention', description: 'Değişen sinyal kurallarına hızlı tepki ver, kombonu koru.', difficulty: 'Orta' },
  { id: 'pattern-forge', name: 'Pattern Forge', category: 'Logic', description: 'Görsel makinede şekil, renk, boyut ve yön kurallarını uygula.', difficulty: 'Orta' },
  { id: 'memory-market', name: 'Memory Market', category: 'Memory', description: 'Market rafındaki ürünleri, fiyatları, renkleri ve konumları hatırla.', difficulty: 'Orta' },
  { id: 'traffic-control', name: 'Traffic Control', category: 'Attention', description: 'Kavşaktaki öncelikleri yönet ve araç akışını güvenle sürdür.', difficulty: 'Orta' },
  { id: 'word-snap', name: 'Word Snap', category: 'Language', description: 'Kategori değişimlerini izle ve uygun kelimeleri zamanında yakala.', difficulty: 'Orta' },
  { id: 'resource-rush', name: 'Resource Rush', category: 'Planning', description: 'Risk ve ödülü tartarak enerji, zaman ve kredilerini yönet.', difficulty: 'Zor' },
  { id: 'the-last-clue', name: 'The Last Clue', category: 'Problem Solving', description: 'Farklı olay dosyalarında zaman ipuçlarını zincirleyip sonucu çıkar.', difficulty: 'Zor' },
]

const estimatedTimes = {
  memory: 3, reaction: 2, oddOneOut: 2, patternLogic: 3, mathRush: 2, numberSequence: 3,
  stroop: 2, numberMemory: 3, taskSwitch: 3, visualSearch: 3, memoryMatrix: 3, sequenceRecall: 3,
  speedMatch: 2, quickSort: 3, multiTrack: 3, gridPath: 5, 'tower-of-hanoi': 5, mastermind: 5,
  'safe-cracker': 5, 'courier-rush': 4, 'signal-rush': 3, 'memory-market': 4,
  'traffic-control': 4, 'word-snap': 3, 'resource-rush': 5, 'the-last-clue': 5, 'pattern-forge': 4,
}
const icons = {
  memory: '◉', reaction: '↗', oddOneOut: '⊙', patternLogic: '✳', mathRush: 'ï¼‹', numberSequence: '123',
  stroop: 'Î£', numberMemory: '◉', taskSwitch: '⇄', visualSearch: '⌕', memoryMatrix: '▦', sequenceRecall: '↟',
  speedMatch: '≈', quickSort: '⇅', multiTrack: '◎', gridPath: '⌖', 'tower-of-hanoi': '♜', mastermind: '●',
  'courier-rush': '➤', 'signal-rush': '⌁', 'memory-market': '▤', 'traffic-control': '⇥', 'word-snap': 'Aa',
  'resource-rush': '◈', 'the-last-clue': '⌕', 'pattern-forge': '⚒',
}

export const games = entries.map(game => ({
  ...game,
  title: game.name,
  category: gameCategory[game.id] || game.category,
  estimatedTime: estimatedTimes[game.id] || 3,
  estimatedDuration: estimatedTimes[game.id] || 3,
  icon: icons[game.id] || '◈',
  accent: ({ Memory: '#9eaa78', Attention: '#b1a779', Speed: '#b99a69', Logic: '#82966e', Flexibility: '#a2ad84' })[gameCategory[game.id]] || '#87976a',
}))

export default games

