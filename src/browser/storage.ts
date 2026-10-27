import { encodeSave, type LoadedSave } from '../engine/save';
export const SAVE_KEY = 'far-wake.save.v1';
export const BACKUP_KEY = 'far-wake.backup.v1';
/** Back up the current checkpoint and durably write its replacement before the
 * host changes its active simulation. A failed write leaves memory unchanged.
 */
export function writeReplacement(
  storage: Pick<Storage, 'setItem'>,
  current: LoadedSave,
  next: LoadedSave,
): void {
  try {
    storage.setItem(BACKUP_KEY, encodeSave(current.state, current.savedAt));
  } catch {
    throw Error(
      'Replacement not saved: the current expedition could not be backed up. It is unchanged. Export your save and free browser storage before trying again.',
    );
  }
  try {
    storage.setItem(SAVE_KEY, encodeSave(next.state, next.savedAt));
  } catch {
    throw Error(
      'Replacement not saved: browser storage is unavailable or full. The current expedition is unchanged. Export your save and free browser storage before trying again.',
    );
  }
}
