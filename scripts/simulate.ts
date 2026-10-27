import { createGame } from '../src/game/definition';
import { advance, createState, dispatch, price, cargo } from '../src/engine/simulation';
import type { Command, GameState } from '../src/engine/types';
export function simulate(seed: number) {
  const g = createGame(seed);
  let s = createState(g, seed),
    orders = 0;
  const doOrder = (c: Command) => {
    const result = dispatch(g, s, c);
    if (result.error)
      throw Error(`Seed ${seed} at ${s.location}: ${JSON.stringify(c)}: ${result.error}`);
    s = result.state;
    orders++;
  };
  const finish = () => {
    let loops = 0;
    while (s.primary || s.support || s.encounter) {
      if (++loops > 20) throw Error('Unresolved jobs');
      if (s.encounter) doOrder({ type: 'encounter', choice: 'surrender' });
      else s = advance(g, s, Math.max(s.primary?.remaining ?? 0, s.support?.remaining ?? 0) + 1);
    }
  };
  const activity = (id: string) => {
    doOrder({ type: 'activity', id });
    finish();
  };
  const travel = (target: string) => {
    if (s.integrity < 30) {
      if (s.inventory.parts < 3) throw Error('Bot failed to keep repair reserve');
      activity('repair');
    }
    doOrder({ type: 'travel', target });
    finish();
  };
  const earn = (amount: number) => {
    let loops = 0;
    while (s.inventory.credits < amount) {
      if (++loops > 100) throw Error('Bot stuck earning');
      activity('work');
    }
  };
  const prepare = () => {
    for (const id of ['ore', 'ice'])
      if (s.inventory[id])
        doOrder({ type: 'trade', resource: id, amount: s.inventory[id], direction: 'sell' });
    for (const [resource, target] of Object.entries({
      fuel: 56,
      parts: 13,
      provisions: 24,
      ammo: 5,
    })) {
      const amount = Math.max(0, target - s.inventory[resource]);
      if (amount) {
        earn(amount * price(g, s, resource, 'buy'));
        doOrder({ type: 'trade', resource, amount, direction: 'buy' });
      }
    }
    while (s.integrity < 90) activity('repair');
    if (s.wear > 30) activity('service');
    if (s.crew.some((c) => c.injury)) {
      earn(25);
      activity('heal');
    }
  };
  const survey = (target: string) => {
    travel(target);
    activity('survey');
    activity('explore');
    activity('gather');
  };
  doOrder({ type: 'accept', id: 'first-light' });
  survey('cinder');
  survey('morrow');
  survey('rubble');
  travel('anchor');
  doOrder({ type: 'claim', id: 'first-light' });
  prepare();
  travel('cinder');
  travel('pale-0');
  prepare();
  for (const id of ['pale-1', 'pale-2', 'pale-3']) survey(id);
  travel('pale-0');
  prepare();
  travel('pale-1');
  travel('hollow-0');
  prepare();
  for (const id of ['hollow-1', 'hollow-2', 'hollow-3']) survey(id);
  travel('hollow-0');
  prepare();
  survey('meridian-1');
  travel('meridian-0');
  prepare();
  survey('meridian-2');
  survey('meridian-3');
  travel('meridian-0');
  if (!s.milestones.includes('frontier') || !s.milestones.includes('interstellar'))
    throw Error('Bot did not reach the charter milestones');
  if (cargo(g, s) > s.capacity || Object.values(s.inventory).some((n) => n < 0))
    throw Error('Invalid resources');
  return {
    seed,
    orders,
    minutes: Math.round(s.elapsed / 60),
    years: Math.round(s.calendarDays / 365.25),
    surveyed: Object.entries(s.discoveries).filter(
      ([id, d]) => d.surveyed && !g.locations.find((l) => l.id === id)!.station,
    ).length,
    integrity: s.integrity,
  };
}
if (process.argv[1]?.endsWith('simulate.ts'))
  for (const seed of [1701, 1, 7, 44, 91, 812, 2026, 4294967295]) console.log(simulate(seed));
