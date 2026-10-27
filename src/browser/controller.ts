import type { Command, GameDefinition, GameState } from '../engine/types';
export interface AppController {
  command: (command: Command) => void;
  exportSave: () => string;
  backupSave: () => string;
  importSave: (text: string) => void;
  reset: (seed: number) => void;
  isOwner: () => boolean;
  storageStatus: () => string;
  storageError: () => string;
  setSound: (enabled: boolean) => void;
  setMotion: (enabled: boolean) => void;
  preferences: { sound: boolean; motion: boolean };
}
export interface GameApp {
  update: (state: GameState, definition: GameDefinition, force?: boolean) => void;
  notify: (message: string) => void;
}
