import { living, crewCapacity, recruitName } from './personnel';
import { threatAlert, developThreat, respondToThreat } from './threats';
import { routesAt } from './navigation';
import { discoverAtSite, discoveryChoice } from './discoveries';
import { explorationPlan } from './sites';
import { missionDiscovered, missionWorkError } from './missions';
import type {
  Amounts,
  Command,
  CommandResult,
  GameDefinition,
  GameState,
  Job,
  LocationDef,
} from './types';
import { random } from './random';
export const OFFLINE_CAP = 86400;
const clone = <T>(value: T): T => structuredClone(value);
const round = (n: number) => Math.round(n * 1000) / 1000;
export function cargo(g: GameDefinition, s: GameState): number {
  return g.resources.reduce((sum, r) => sum + (s.inventory[r.id] ?? 0) * r.mass, 0);
}
export function affordable(s: GameState, cost: Amounts): boolean {
  return Object.entries(cost).every(([id, n]) => (s.inventory[id] ?? 0) >= n);
}
function spend(s: GameState, cost: Amounts) {
  for (const [id, n] of Object.entries(cost)) s.inventory[id] = (s.inventory[id] ?? 0) - n;
}
function event(s: GameState, key: string, params: Record<string, string | number> = {}) {
  s.events.push({ id: s.nextEvent++, at: s.elapsed, key, params });
  s.events = s.events.slice(-100);
}
function gain(g: GameDefinition, s: GameState, reward: Amounts) {
  let overflow = 0;
  for (const [id, amount] of Object.entries(reward)) {
    const def = g.resources.find((r) => r.id === id);
    if (!def) continue;
    let n = amount;
    if (def.mass > 0)
      n = Math.min(n, Math.max(0, Math.floor((s.capacity - cargo(g, s)) / def.mass)));
    overflow += amount - n;
    s.inventory[id] = (s.inventory[id] ?? 0) + n;
  }
  if (overflow) event(s, 'cargoFull', { lost: overflow });
}
function progress(g: GameDefinition, s: GameState, kind: string, target?: string) {
  for (const m of s.missions) {
    const def = g.missions.find((d) => d.id === m.id)!;
    if (
      !m.claimed &&
      def.objective.kind === kind &&
      (!def.objective.target || def.objective.target === target)
    )
      m.progress = Math.min(def.objective.count, m.progress + 1);
  }
}
function roll(s: GameState) {
  const [v, next] = random(s.rng);
  s.rng = next;
  return v;
}
export function createState(g: GameDefinition, seed: number): GameState {
  const known = g.locations.filter((l) => l.initiallyKnown).map((l) => l.id);
  return {
    version: 3,
    definition: g.id,
    generationVersion: g.generationVersion,
    seed: seed >>> 0,
    rng: seed >>> 0,
    elapsed: 0,
    calendarDays: 0,
    location: g.initial.location,
    inventory: clone(g.initial.inventory),
    integrity: 100,
    wear: 8,
    capacity: g.initial.capacity,
    debt: 0,
    crew: clone(g.initial.crew).map((member) => ({ ...member, life: 'alive' as const })),
    recruitSerial: 0,
    threat: null,
    threatHistory: [],
    incidents: [],
    discoveryCooldown: 0,
    known,
    discoveries: Object.fromEntries(
      known.map((id) => [
        id,
        { surveyed: g.locations.find((l) => l.id === id)!.station, sites: [], dataSold: false },
      ]),
    ),
    reputation: Object.fromEntries(g.factions.map((f) => [f.id, 0])),
    primary: null,
    support: null,
    encounter: null,
    missions: [],
    upgrades: [],
    events: [{ id: 0, at: 0, key: 'welcome', params: {} }],
    nextEvent: 1,
    milestones: [],
  };
}
export function skillBonus(
  g: GameDefinition,
  s: GameState,
  skill: string,
  slot: 'primary' | 'support',
) {
  return (
    s.crew
      .filter((c) => c.life !== 'dead' && c.assignment === slot && c.skill === skill)
      .reduce((n, c) => n + (c.injury ? 0.06 : 0.18), 0) +
    g.upgrades
      .filter((u) => s.upgrades.includes(u.id) && u.skill === skill)
      .reduce((n, u) => n + (u.bonus ?? 0), 0)
  );
}
export function activityDuration(
  g: GameDefinition,
  s: GameState,
  id: string,
  site?: string,
  approach?: string,
) {
  const a = g.activities.find((a) => a.id === id)!;
  const plan = id === g.rules.exploreActivity ? explorationPlan(g, s, site, approach) : undefined;
  const seconds = plan && typeof plan !== 'string' ? plan.approach.seconds : a.seconds;
  return Math.round(seconds / (1 + skillBonus(g, s, a.skill, a.slot)));
}
export function routesFrom(g: GameDefinition, s: GameState) {
  return routesAt(g, s.location).map((route) => ({ ...route, target: route.to }));
}
export function view(g: GameDefinition, s: GameState) {
  return {
    location: g.locations.find((l) => l.id === s.location)!,
    region: g.regions.find((r) => r.id === g.locations.find((l) => l.id === s.location)!.region)!,
    routes: routesFrom(g, s),
    cargo: cargo(g, s),
    year: g.rules.startingYear + Math.floor((s.calendarDays + s.elapsed / 86400) / 365.25),
    completedMissions: s.missions.filter((m) => m.claimed).length,
  };
}
function rep(s: GameState, id: string, n: number) {
  s.reputation[id] = Math.max(-100, Math.min(100, (s.reputation[id] ?? 0) + n));
}
export function price(
  g: GameDefinition,
  s: GameState,
  resource: string,
  direction: 'buy' | 'sell',
) {
  const r = g.resources.find((r) => r.id === resource)!;
  const faction = g.locations.find((l) => l.id === s.location)?.faction;
  const standing = faction ? (s.reputation[faction] ?? 0) : 0;
  const cycle = g.rules.marketCycle;
  const factor = cycle
    ? cycle.multipliers[Math.floor(s.calendarDays / cycle.days) % cycle.multipliers.length]
    : 1;
  return direction === 'buy'
    ? Math.max(1, Math.ceil(r.price * factor * (1 - standing / 250)))
    : Math.max(1, Math.floor(r.price * factor * 0.6));
}
export function dispatch(g: GameDefinition, input: GameState, command: Command): CommandResult {
  const s = clone(input),
    loc = g.locations.find((l) => l.id === s.location)!;
  const fail = (error: string): CommandResult => ({ state: input, error });
  if (s.encounter && command.type !== 'encounter')
    return fail('Resolve the encounter before issuing new orders.');
  const threatContext = { event, progress, roll, spend, affordable, bonus: skillBonus };
  if (threatAlert(s) && !['threat', 'assign', 'hire', 'encounter'].includes(command.type))
    return fail('Resolve or contain the threat before resuming operations.');
  if (command.type === 'discovery') {
    const choice = discoveryChoice(g, s, command.id, command.choice);
    if (typeof choice === 'string') return fail(choice);
    s.incidents.find((record) => record.id === command.id)!.choice = choice.id;
    gain(g, s, choice.reward);
    for (const [id, amount] of Object.entries(choice.reputation)) rep(s, id, amount);
    event(s, 'discoverySettled', { discovery: command.id, choice: choice.id });
  } else if (command.type === 'threat') {
    const error = respondToThreat(g, s, command.action, threatContext);
    if (error) return fail(error);
  } else if (command.type === 'hire') {
    if (!loc.station || s.primary?.kind === 'travel' || s.primary?.kind === 'rescue')
      return fail('Recruitment requires visiting a service hub.');
    const offer = g.recruitment?.offers.find((o) => o.id === command.id);
    if (!offer) return fail('This specialist is not available.');
    if (offer.emergency && living(s).length > 0)
      return fail('Emergency relief is reserved for expeditions with no surviving members.');
    if (living(s).length >= crewCapacity(g, s))
      return fail('No accommodation available. Install a capacity upgrade first.');
    if (s.crew.length >= 1000)
      return fail('The roster archive is full. Export this expedition before starting another.');
    if (!affordable(s, offer.cost)) return fail('Insufficient funds to recruit this specialist.');
    spend(s, offer.cost);
    const serial = s.recruitSerial++;
    const member = {
      id: `${offer.id}-${serial}`,
      name: recruitName(offer, s.seed, serial),
      skill: offer.skill,
      assignment: 'rest' as const,
      injury: 0,
      life: 'alive' as const,
      recruit: offer.id,
    };
    s.crew.push(member);
    event(s, 'memberHired', { member: member.name, skill: member.skill });
  } else if (command.type === 'assign') {
    const member = s.crew.find((c) => c.id === command.member);
    if (!member || member.life === 'dead') return fail('This member is not available for duty.');
    if (!['primary', 'support', 'rest'].includes(command.assignment))
      return fail('Unknown assignment.');
    if (
      (member.assignment === 'primary' && s.primary) ||
      (member.assignment === 'support' && s.support) ||
      (command.assignment === 'primary' && s.primary) ||
      (command.assignment === 'support' && s.support)
    )
      return fail('Assignments are locked while that team is working.');
    member.assignment = command.assignment;
  } else if (command.type === 'travel') {
    if (s.primary) return fail('Your current journey or expedition must finish first.');
    if (s.support) return fail('Finish the support job before departing.');
    const route = routesFrom(g, s).find((r) => r.target === command.target);
    if (!route) return fail('No route to that destination.');
    if (!s.known.includes(command.target))
      return fail('Survey this region to locate that destination.');
    if (s.integrity < 25) return fail('Condition below 25%. Repair before departure.');
    if (!affordable(s, route.cost)) return fail('Insufficient supplies for this journey.');
    spend(s, route.cost);
    s.wear = Math.min(100, s.wear + (route.interregional ? 12 : 3));
    s.primary = {
      id: `j${s.nextEvent}`,
      kind: 'travel',
      definition: 'travel',
      target: command.target,
      remaining: route.seconds,
      total: route.seconds,
      days: route.days,
      reward: {},
      risk: route.risk,
    };
    event(s, 'departed', { target: command.target, days: route.days });
  } else if (command.type === 'activity' || command.type === 'work' || command.type === 'aid') {
    const id =
      command.type === 'work'
        ? g.rules.workActivity
        : command.type === 'aid'
          ? g.rules.aidActivity
          : command.id;
    const a = g.activities.find((a) => a.id === id);
    if (!a) return fail('Unknown activity.');
    if (a.mission) {
      const error = missionWorkError(g, s, a.mission);
      if (error) return fail(error);
    }
    const selection = command.type === 'activity' ? command : undefined;
    if (id !== g.rules.exploreActivity && (selection?.site || selection?.approach))
      return fail('Site approaches are only available for exploration.');
    const plan =
      id === g.rules.exploreActivity
        ? explorationPlan(g, s, selection?.site, selection?.approach)
        : undefined;
    if (typeof plan === 'string') return fail(plan);
    if (s[a.slot]) return fail('That team is already working.');
    if (a.slot === 'support' && s.primary?.kind === 'rescue')
      return fail('Wait for recovery to finish.');
    if (a.slot === 'support' && s.primary?.kind === 'travel' && a.at !== 'any')
      return fail('This activity requires a destination.');
    if (a.at === 'station' && (!loc.station || s.primary?.kind === 'travel'))
      return fail('Visit a service hub first.');
    if (a.at === 'field' && loc.station) return fail('Choose an exploration destination first.');
    const discovery = s.discoveries[loc.id];
    if (a.locations && !a.locations.includes(loc.id))
      return fail('This activity is available at a different location.');
    if (a.effect === 'expose' && (s.threat || s.threatHistory.includes(a.threat ?? '')))
      return fail('This expedition incident has already been investigated.');
    for (const requirement of [...(a.requirements ?? []), ...(plan?.approach.requirements ?? [])]) {
      const count = living(s).filter(
        (member) =>
          member.skill === requirement.skill &&
          member.assignment === (requirement.assignment ?? a.slot),
      ).length;
      if (count < requirement.count)
        return fail(
          `Requires ${requirement.count} ${requirement.skill} specialist on the ${requirement.assignment ?? a.slot} team.`,
        );
    }
    if (a.requiresSurvey && !discovery?.surveyed) return fail('Complete a survey first.');
    if (id === g.rules.surveyActivity && discovery?.surveyed)
      return fail('This location is already surveyed.');
    if (id === g.rules.exploreActivity && discovery?.sites.length >= loc.sites.length)
      return fail('All sites here have been explored.');
    if (id === g.rules.raidActivity && loc.danger === 0)
      return fail('There is no hostile presence here.');
    if (a.effect === 'repair' && s.integrity >= 100)
      return fail('Condition is already at maximum.');
    if (a.effect === 'service' && s.wear === 0) return fail('Equipment is already fully serviced.');
    if (a.effect === 'heal' && !living(s).some((c) => c.injury))
      return fail('Nobody needs treatment.');
    if (!living(s).some((c) => c.assignment === a.slot))
      return fail('Assign at least one living member to this team.');
    const cost = plan?.approach.cost ?? a.cost;
    if (!affordable(s, cost)) return fail('Insufficient supplies for this activity.');
    const duration = activityDuration(g, s, id, selection?.site, selection?.approach);
    spend(s, cost);
    s[a.slot] = {
      id: `j${s.nextEvent}`,
      kind: 'activity',
      definition: id,
      target: s.location,
      remaining: duration,
      total: duration,
      days: 0,
      reward: clone(plan?.approach.reward ?? a.reward),
      risk: plan?.approach.risk ?? (a.slot === 'primary' && a.at === 'field' ? loc.danger : 0),
      ...(plan ? { site: plan.site.id } : {}),
    };
    if (id === g.rules.gatherActivity)
      s[a.slot]!.reward = Object.fromEntries(
        Object.entries(loc.yields).map(([r, n]) => [
          r,
          Math.round(n * (1 + skillBonus(g, s, a.skill, a.slot))),
        ]),
      );
    event(s, 'activityStarted', {
      activity: id,
      ...(plan ? { site: plan.site.id, approach: plan.approach.id } : {}),
    });
  } else if (command.type === 'rescue') {
    if (loc.station || s.primary?.kind === 'travel' || s.primary?.kind === 'rescue')
      return fail('Recovery is available while stranded at a field destination.');
    if (s.primary || s.support)
      return fail('Finish current activities before requesting recovery.');
    const station =
      g.locations.find((l) => l.station && l.region === loc.region) ??
      g.locations.find((l) => l.id === g.initial.location)!;
    s.debt += g.rules.recoveryDebt;
    s.primary = {
      id: `j${s.nextEvent}`,
      kind: 'rescue',
      definition: 'rescue',
      target: station.id,
      remaining: g.rules.recoverySeconds,
      total: g.rules.recoverySeconds,
      days: 0,
      reward: {},
      risk: 0,
    };
    event(s, 'rescueRequested');
  } else if (command.type === 'trade') {
    if (!loc.station || s.primary?.kind === 'travel' || s.primary?.kind === 'rescue')
      return fail('Trading requires visiting a service hub.');
    const r = g.resources.find((r) => r.id === command.resource);
    if (
      !r ||
      r.id === g.rules.currency ||
      !Number.isInteger(command.amount) ||
      command.amount <= 0 ||
      command.amount > 10000
    )
      return fail('Invalid trade quantity.');
    const n = command.amount,
      currency = g.rules.currency;
    if (command.direction === 'buy') {
      const cost = n * price(g, s, r.id, 'buy');
      if ((s.inventory[currency] ?? 0) < cost) return fail('Insufficient funds.');
      if (cargo(g, s) + r.mass * n > s.capacity) return fail('Not enough cargo space.');
      s.inventory[currency] -= cost;
      s.inventory[r.id] = (s.inventory[r.id] ?? 0) + n;
    } else {
      if ((s.inventory[r.id] ?? 0) < n) return fail('Not enough stock to sell.');
      s.inventory[r.id] -= n;
      gain(g, s, { [currency]: n * price(g, s, r.id, 'sell') });
    }
    event(s, 'trade', { resource: r.id, amount: n, direction: command.direction });
  } else if (command.type === 'accept') {
    if (!loc.station || s.primary?.kind === 'travel')
      return fail('Visit a service hub mission board.');
    const m = g.missions.find((m) => m.id === command.id);
    if (!m || s.missions.some((x) => x.id === m.id)) return fail('Contract unavailable.');
    if (!missionDiscovered(g, s, m))
      return fail('Explore the source site before accepting this follow-up.');
    if (m.requires && !s.missions.some((x) => x.id === m.requires && x.claimed))
      return fail('Complete the prerequisite contract first.');
    if (s.missions.filter((x) => !x.claimed).length >= 3)
      return fail('Finish a contract first: maximum three active contracts.');
    if ((s.reputation[m.faction] ?? 0) < -40)
      return fail('This faction will not offer you contracts at your current standing.');
    let initialProgress = 0;
    const targets = m.objective.target ? [m.objective.target] : Object.keys(s.discoveries);
    if (m.objective.kind === g.rules.surveyActivity)
      initialProgress = targets.filter(
        (id) => s.discoveries[id]?.surveyed && !g.locations.find((l) => l.id === id)?.station,
      ).length;
    if (m.objective.kind === g.rules.exploreActivity)
      initialProgress = targets.reduce((n, id) => n + (s.discoveries[id]?.sites.length ?? 0), 0);
    if (m.objective.kind === 'travel' && m.objective.target === s.location) initialProgress = 1;
    if (m.objective.kind === 'threatStopped')
      initialProgress = s.threatHistory.filter(
        (id) => (!m.objective.target || m.objective.target === id) && s.threat?.id !== id,
      ).length;
    s.missions.push({
      id: m.id,
      progress: Math.min(m.objective.count, initialProgress),
      claimed: false,
    });
    event(s, 'missionAccepted', { mission: m.id });
  } else if (command.type === 'abandon') {
    const m = s.missions.find((m) => m.id === command.id);
    if (!m || m.claimed) return fail('No active contract to abandon.');
    const def = g.missions.find((definition) => definition.id === m.id)!;
    if (def.sourceSite || g.activities.some((activity) => activity.mission === m.id)) {
      if (m.progress >= def.objective.count)
        return fail('Completed follow-up work is retained until filed at a service hub.');
      if (
        [s.primary, s.support].some(
          (job) =>
            job &&
            g.activities.find((activity) => activity.id === job.definition)?.mission === m.id,
        )
      )
        return fail('Finish the committed follow-up work before abandoning its contract.');
    }
    s.missions = s.missions.filter((m) => m.id !== command.id);
    event(s, 'missionAbandoned', { mission: command.id });
  } else if (command.type === 'claim') {
    if (!loc.station || s.primary?.kind === 'travel')
      return fail('Visit a service hub to file the contract.');
    const m = s.missions.find((m) => m.id === command.id),
      def = g.missions.find((d) => d.id === command.id);
    if (!m || !def || m.claimed || m.progress < def.objective.count)
      return fail('Contract objectives are not complete.');
    m.claimed = true;
    gain(g, s, def.reward);
    rep(s, def.faction, def.reputation);
    event(s, 'missionClaimed', { mission: def.id });
  } else if (command.type === 'sellData') {
    if (!loc.station || s.primary?.kind === 'travel') return fail('Visit a service hub exchange.');
    const records = Object.entries(s.discoveries).filter(
      ([id, d]) => d.surveyed && !d.dataSold && !g.locations.find((l) => l.id === id)!.station,
    );
    if (!records.length) return fail('No unpublished survey data.');
    for (const [, d] of records) d.dataSold = true;
    gain(g, s, { [g.rules.currency]: records.length * 90 });
    if (loc.faction) rep(s, loc.faction, records.length * 3);
    const other = g.factions.find(
      (f) => f.id !== loc.faction && f.id !== g.rules.oppositionFaction,
    );
    if (other) rep(s, other.id, -records.length * 2);
    progress(g, s, 'sellData');
    event(s, 'dataSold', { count: records.length, faction: loc.faction ?? '' });
  } else if (command.type === 'upgrade') {
    if (!loc.station || s.primary?.kind === 'travel')
      return fail('Visit a service hub for equipment installation.');
    const u = g.upgrades.find((u) => u.id === command.id);
    if (!u || s.upgrades.includes(u.id)) return fail('Equipment unavailable.');
    if (!affordable(s, u.cost)) return fail('Insufficient supplies for this upgrade.');
    spend(s, u.cost);
    s.upgrades.push(u.id);
    s.capacity += u.capacity ?? 0;
    event(s, 'upgraded', { upgrade: u.id });
  } else if (command.type === 'encounter') {
    if (!s.encounter) return fail('No encounter is pending.');
    const foe = s.encounter.source,
      power = s.encounter.strength;
    if (command.choice === 'fight') {
      const ammo = g.rules.ammunition;
      if ((s.inventory[ammo] ?? 0) < 2) return fail('Two ammunition units are required to fire.');
      s.inventory[ammo] -= 2;
      const chance = Math.min(
        0.95,
        0.55 +
          skillBonus(g, s, g.rules.combatSkill, 'primary') +
          (g.rules.additionalCombatSkill
            ? skillBonus(g, s, g.rules.additionalCombatSkill, 'primary')
            : 0) -
          power * 0.06,
      );
      if (roll(s) < chance) {
        gain(g, s, { [g.rules.currency]: 60, [g.rules.materials]: 3 });
        rep(s, foe, -5);
        for (const f of g.factions) if (f.id !== foe) rep(s, f.id, 2);
        progress(g, s, 'combatWon');
        event(s, 'combatWon');
        s.encounter = null;
      } else {
        s.integrity = Math.max(10, s.integrity - 12);
        s.encounter.round = (s.encounter.round ?? 0) + 1;
        event(s, 'combatDamage');
        if (s.encounter.round >= 2) {
          s.encounter = null;
          event(s, 'escapedDamaged');
        }
      }
    } else if (command.choice === 'evade') {
      const cost = { [g.rules.travelResource]: 2 };
      if (!affordable(s, cost)) return fail('Two travel supply units are required to evade.');
      spend(s, cost);
      const hit = roll(s) < 0.25;
      s.integrity = Math.max(10, s.integrity - (hit ? 10 : 0));
      event(s, hit ? 'escapedDamaged' : 'escaped');
      s.encounter = null;
    } else if (command.choice === 'bargain') {
      const cost = { [g.rules.currency]: 40 };
      if (!affordable(s, cost))
        return fail('You need 40 currency units to negotiate safe passage.');
      spend(s, cost);
      rep(s, foe, 2);
      event(s, 'bargained');
      s.encounter = null;
    } else if (command.choice === 'surrender') {
      for (const r of g.resources)
        if (r.mass > 0) s.inventory[r.id] = Math.floor((s.inventory[r.id] ?? 0) * 0.8);
      event(s, 'surrendered');
      s.encounter = null;
    } else return fail('Unknown encounter choice.');
  } else return fail('Unknown command.');
  return { state: s };
}
function complete(g: GameDefinition, s: GameState, job: Job) {
  let exploredSite: string | undefined;
  if (job.kind === 'travel' || job.kind === 'rescue') {
    s.location = job.target;
    s.calendarDays += job.days;
    if (!s.known.includes(job.target)) s.known.push(job.target);
    s.discoveries[job.target] ??= { surveyed: false, sites: [], dataSold: false };
    const loc = g.locations.find((l) => l.id === job.target)!;
    if (loc.station) {
      s.discoveries[job.target].surveyed = true;
      for (const l of g.locations.filter(
        (l) =>
          (l.region === loc.region ||
            g.routes.some(
              (r) =>
                r.interregional &&
                ((r.from === loc.id && r.to === l.id) || (r.to === loc.id && r.from === l.id)),
            )) &&
          !s.known.includes(l.id),
      )) {
        s.known.push(l.id);
        s.discoveries[l.id] = { surveyed: l.station, sites: [], dataSold: false };
      }
    }
    if (job.kind === 'rescue') {
      s.integrity = Math.max(40, s.integrity);
      event(s, 'rescued', { target: job.target });
    } else {
      s.integrity = Math.max(10, s.integrity - Math.ceil(s.wear / 25));
      progress(g, s, 'travel', job.target);
      event(s, 'arrived', { target: job.target, days: job.days });
    }
  } else {
    const a = g.activities.find((a) => a.id === job.definition)!;
    const loc = g.locations.find((l) => l.id === job.target)!;
    const d = (s.discoveries[loc.id] ??= { surveyed: false, sites: [], dataSold: false });
    if (a.id === g.rules.surveyActivity) {
      d.surveyed = true;
      const revealed = g.locations
        .filter(
          (l) =>
            l.region === loc.region ||
            g.routes.some(
              (r) =>
                r.interregional &&
                ((r.from === loc.id && r.to === l.id) || (r.to === loc.id && r.from === l.id)),
            ),
        )
        .filter((l) => !s.known.includes(l.id));
      for (const l of revealed) {
        s.known.push(l.id);
        s.discoveries[l.id] = { surveyed: l.station, sites: [], dataSold: false };
      }
      event(s, 'surveyed', { target: loc.id, count: revealed.length });
    }
    if (a.id === g.rules.exploreActivity) {
      const site = job.site ?? loc.sites.find((id) => !d.sites.includes(id));
      if (site && !d.sites.includes(site)) d.sites.push(site);
      exploredSite = site;
      if (!job.site) gain(g, s, { [g.rules.currency]: 25 });
      event(s, 'siteExplored', { target: loc.id, site: site ?? '' });
    }
    if (a.effect === 'repair') s.integrity = Math.min(100, s.integrity + 35);
    if (a.effect === 'service') s.wear = Math.max(0, s.wear - 35);
    if (a.effect === 'heal') for (const c of living(s)) c.injury = 0;
    if (a.effect === 'aid' && loc.faction) {
      rep(s, loc.faction, 8);
      const rival = g.factions.find(
        (f) => f.id !== loc.faction && f.id !== g.rules.oppositionFaction,
      );
      if (rival) rep(s, rival.id, -2);
      progress(g, s, 'aidDelivered', loc.id);
    }
    gain(g, s, job.reward);
    progress(g, s, a.id, loc.id);
    if (a.id === g.rules.workActivity && s.debt > 0) {
      const paid = Math.min(20, s.debt, s.inventory[g.rules.currency]);
      s.debt -= paid;
      s.inventory[g.rules.currency] -= paid;
    }
    if (a.id === g.rules.raidActivity) {
      s.encounter = {
        id: `e${s.nextEvent}`,
        source: g.rules.oppositionFaction,
        strength: 1 + loc.danger,
      };
      event(s, 'intercepted');
    }
    event(s, 'activityComplete', { activity: a.id, target: loc.id });
    if (g.hooks?.afterActivity) Object.assign(s, g.hooks.afterActivity(clone(s), a));
  }
  if (job.risk > 0 && !s.encounter && roll(s) < job.risk) {
    if (roll(s) < 0.5) {
      s.encounter = { id: `e${s.nextEvent}`, source: g.rules.oppositionFaction, strength: 1 };
      event(s, 'intercepted');
    } else {
      s.integrity = Math.max(10, s.integrity - 8);
      const c = living(s).find((c) => c.assignment === 'primary');
      if (c) c.injury = 1;
      event(s, 'hazard');
    }
  }
  developThreat(g, s, job, { event, progress, roll, spend, affordable, bonus: skillBonus });
  if (exploredSite) discoverAtSite(g, s, job.target, exploredSite, { event, roll });
  const surveyed = Object.entries(s.discoveries).filter(
    ([id, d]) => d.surveyed && !g.locations.find((l) => l.id === id)!.station,
  ).length;
  for (const milestone of g.milestones ?? []) {
    const value = milestone.measure === 'journeyDays' ? job.days : surveyed;
    if (value >= milestone.threshold && !s.milestones.includes(milestone.id)) {
      s.milestones.push(milestone.id);
      event(s, 'milestone', { milestone: milestone.id });
    }
  }
}
/** Advance to activity boundaries; no per-frame randomness or repeated rewards. */
export function advance(g: GameDefinition, input: GameState, seconds: number): GameState {
  if (!Number.isFinite(seconds) || seconds <= 0 || input.encounter || threatAlert(input))
    return input;
  const s = clone(input);
  let left = round(Math.min(seconds, OFFLINE_CAP));
  while (left > 0 && !s.encounter && !threatAlert(s)) {
    const jobs = [s.primary, s.support].filter((j): j is Job => j !== null);
    const step = round(Math.min(left, ...jobs.map((j) => j.remaining)));
    if (step <= 0) break;
    s.elapsed = round(s.elapsed + step);
    left = round(left - step);
    for (const j of jobs) j.remaining = round(j.remaining - step);
    // Resolve both simultaneous completions before pausing for a resulting encounter.
    for (const slot of ['primary', 'support'] as const) {
      const j = s[slot];
      if (j && j.remaining <= 0) {
        s[slot] = null;
        complete(g, s, j);
      }
    }
  }
  return s;
}
