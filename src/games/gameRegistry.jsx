import MemoryGame from './MemoryGame.jsx'
import ReactionGame from './ReactionGame.jsx'
import OddOneOutGame from './OddOneOutGame.jsx'
import NumberSequenceGame from './NumberSequenceGame.jsx'
import PatternLogicGame from './PatternLogicGame.jsx'
import MathRushGame from './MathRushGame.jsx'
import StroopGame from './StroopGame.jsx'
import NumberMemoryGame from './NumberMemoryGame.jsx'
import TaskSwitchGame from './TaskSwitchGame.jsx'
import VisualSearchGame from './VisualSearchGame.jsx'
import MemoryMatrixGame from './MemoryMatrixGame.jsx'
import SequenceRecallGame from './SequenceRecallGame.jsx'
import SpeedMatchGame from './SpeedMatchGame.jsx'
import QuickSortGame from './QuickSortGame.jsx'
import MultiTrackGame from './MultiTrackGame.jsx'
import GridPathGame from './GridPathGame.jsx'
import TowerOfHanoiGame from './TowerOfHanoiGame.jsx'
import MastermindGame from './MastermindGame.jsx'
import DeductionGridGame from './DeductionGridGame.jsx'
import BombDefusalGame from './BombDefusalGame.jsx'
import MemoryHeistGame from './MemoryHeistGame.jsx'
import SafeCrackerGame from './SafeCrackerGame.jsx'
import CourierRushGame from './CourierRushGame.jsx'
import SignalRushGame from './SignalRushGame.jsx'
import MemoryMarketGame from './MemoryMarketGame.jsx'
import TrafficControlGame from './TrafficControlGame.jsx'
import WordSnapGame from './WordSnapGame.jsx'
import ResourceRushGame from './ResourceRushGame.jsx'
import TheLastClueGame from './TheLastClueGame.jsx'
import PatternForgeGame from './PatternForgeGame.jsx'
import { games } from './gameConfig.js'

export const gameComponents = Object.freeze({
  memory: MemoryGame, reaction: ReactionGame, oddOneOut: OddOneOutGame,
  numberSequence: NumberSequenceGame, patternLogic: PatternLogicGame, mathRush: MathRushGame,
  stroop: StroopGame, numberMemory: NumberMemoryGame, taskSwitch: TaskSwitchGame,
  visualSearch: VisualSearchGame, memoryMatrix: MemoryMatrixGame, sequenceRecall: SequenceRecallGame,
  speedMatch: SpeedMatchGame, quickSort: QuickSortGame, multiTrack: MultiTrackGame,
  gridPath: GridPathGame, 'tower-of-hanoi': TowerOfHanoiGame, mastermind: MastermindGame,
  'deduction-grid': DeductionGridGame, 'bomb-defusal': BombDefusalGame,
  'memory-heist': MemoryHeistGame, 'safe-cracker': SafeCrackerGame, 'courier-rush': CourierRushGame,
  'signal-rush': SignalRushGame, 'memory-market': MemoryMarketGame,
  'traffic-control': TrafficControlGame, 'word-snap': WordSnapGame,
  'resource-rush': ResourceRushGame, 'the-last-clue': TheLastClueGame, 'pattern-forge': PatternForgeGame,
})

// Each catalog item carries its playable component alongside its discovery metadata.
export const gameCatalog = games.map(game => ({ ...game, component: gameComponents[game.id] }))
