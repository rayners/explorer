import { it, expect } from 'vitest';
import { writeReplacement, SAVE_KEY, BACKUP_KEY } from '../src/browser/storage';
import { createState } from '../src/engine/simulation';
import { createGame } from '../src/game/definition';
import { encodeSave } from '../src/engine/save';
const current = { state: createState(createGame(1701), 1701), savedAt: 1000 };
const next = { state: createState(createGame(44), 44), savedAt: 2000 };
it('retains the previous checkpoint if writing its replacement fails', () => {
  const data = new Map([[SAVE_KEY, encodeSave(current.state, current.savedAt)]]);
  const storage = {
    setItem: (key: string, value: string) => {
      if (key === SAVE_KEY) throw Error('Quota exceeded');
      data.set(key, value);
    },
  };
  expect(() => writeReplacement(storage, current, next)).toThrow('not saved');
  expect(data.get(SAVE_KEY)).toBe(encodeSave(current.state, current.savedAt));
  expect(data.get(BACKUP_KEY)).toBe(encodeSave(current.state, current.savedAt));
});
it('does not replace the main save if its backup could not be stored', () => {
  const data = new Map([[SAVE_KEY, encodeSave(current.state, current.savedAt)]]);
  const storage = {
    setItem: (key: string, value: string) => {
      if (key === BACKUP_KEY) throw Error('Quota exceeded');
      data.set(key, value);
    },
  };
  expect(() => writeReplacement(storage, current, next)).toThrow('backed up');
  expect(data.get(SAVE_KEY)).toBe(encodeSave(current.state, current.savedAt));
});
it('writes the replacement and keeps a portable backup when storage is available', () => {
  const data = new Map<string, string>();
  writeReplacement(
    {
      setItem: (key, value) => {
        data.set(key, value);
      },
    },
    current,
    next,
  );
  expect(data.get(SAVE_KEY)).toBe(encodeSave(next.state, next.savedAt));
  expect(data.get(BACKUP_KEY)).toBe(encodeSave(current.state, current.savedAt));
});
