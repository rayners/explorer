import { activityParticipants, activitySkills, EXPERIENCE_CAP } from './proficiency';
import { crewCapacity, living, recruitName } from './personnel';
import type { DefinitionFactory, GameDefinition, GameState, Job } from './types';
import { advance, OFFLINE_CAP } from './simulation';
import { missionDiscovered } from './missions';
import { watchActivity, watchPolicy } from './work-watches';
export interface SaveEnvelope {
  format: 'exploration-save';
  version: 1;
  savedAt: number;
  state: GameState;
  checksum: string;
}
export interface LoadedSave {
  state: GameState;
  savedAt: number;
  awaySeconds?: number;
}
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const unique = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') && new Set(v).size === v.length;
function checksum(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
/** Validate external data before allowing it into a simulation. */
function validateStateSchema(
  value: unknown,
  g: GameDefinition,
  schema: 3 | 4 | 5,
): value is GameState {
  if (!object(value)) return false;
  const s = value as unknown as GameState;
  const locations = new Set(g.locations.map((l) => l.id)),
    activities = new Set(g.activities.map((a) => a.id)),
    resources = new Set(g.resources.map((r) => r.id));
  if (
    s.version !== schema ||
    s.definition !== g.id ||
    s.generationVersion !== g.generationVersion ||
    !Number.isInteger(s.seed) ||
    s.seed < 0 ||
    s.seed > 4294967295 ||
    !Number.isInteger(s.rng) ||
    s.rng < 0 ||
    s.rng > 4294967295
  )
    return false;
  if (
    !locations.has(s.location) ||
    ![s.elapsed, s.calendarDays, s.integrity, s.wear, s.capacity, s.debt, s.nextEvent].every(
      finite,
    ) ||
    s.integrity > 100 ||
    s.wear > 100 ||
    s.capacity > 100000 ||
    s.capacity < 1
  )
    return false;
  if (
    !object(s.inventory) ||
    !g.resources.every((r) => finite(s.inventory[r.id])) ||
    !Object.keys(s.inventory).every((k) => resources.has(k))
  )
    return false;
  if (
    !unique(s.known) ||
    !s.known.includes(s.location) ||
    !s.known.every((id) => locations.has(id))
  )
    return false;
  if (
    !object(s.discoveries) ||
    !s.known.every((id) => object(s.discoveries[id])) ||
    !Object.entries(s.discoveries).every(
      ([id, d]) =>
        locations.has(id) &&
        s.known.includes(id) &&
        object(d) &&
        typeof d.surveyed === 'boolean' &&
        typeof d.dataSold === 'boolean' &&
        unique(d.sites) &&
        d.sites.every((site) => g.locations.find((l) => l.id === id)!.sites.includes(site)),
    )
  )
    return false;
  if (
    !object(s.reputation) ||
    !g.factions.every(
      (f) =>
        typeof s.reputation[f.id] === 'number' &&
        Number.isFinite(s.reputation[f.id]) &&
        Math.abs(s.reputation[f.id]) <= 100,
    )
  )
    return false;
  const job = (j: Job | null): boolean => {
    if (j === null) return true;
    if (!object(j)) return false;
    const activity =
      j.kind === 'activity' ? g.activities.find((entry) => entry.id === j.definition) : undefined;
    const mission = activity?.mission
      ? g.missions.find((entry) => entry.id === activity.mission)
      : undefined;
    return (
      typeof j.id === 'string' &&
      (schema === 3 ||
        (j.kind === 'activity'
          ? unique(j.participants) &&
            Array.isArray(s.crew) &&
            j.participants.every((id) =>
              s.crew.some(
                (member) =>
                  object(member) &&
                  member.id === id &&
                  !!activity &&
                  activitySkills(
                    activity,
                    g.sites
                      ?.find((site) => site.id === j.site)
                      ?.approaches.flatMap((approach) => approach.requirements ?? []),
                  ).has(member.skill),
              ),
            )
          : j.participants === undefined)) &&
      ['travel', 'activity', 'rescue'].includes(j.kind) &&
      locations.has(j.target) &&
      finite(j.remaining) &&
      j.remaining > 0 &&
      finite(j.total) &&
      j.total >= j.remaining &&
      finite(j.days) &&
      finite(j.risk) &&
      j.risk <= 1 &&
      object(j.reward) &&
      Object.entries(j.reward).every(([k, v]) => resources.has(k) && finite(v)) &&
      (j.watch === undefined ||
        (schema === 5 &&
          object(j.watch) &&
          !!watchPolicy(j.watch.id) &&
          !!watchActivity(g) &&
          j.kind === 'activity' &&
          j.definition === g.rules.workActivity &&
          j.total === watchPolicy(j.watch.id)!.seconds &&
          j.target === s.location &&
          !!g.locations.find((location) => location.id === j.target)?.station &&
          j.site === undefined &&
          j.days === 0 &&
          j.risk === 0 &&
          Object.keys(j.reward).length === 1 &&
          j.reward[g.rules.currency] > 0 &&
          finite(j.watch.debtPayment) &&
          j.watch.debtPayment <= j.reward[g.rules.currency] &&
          j.watch.debtPayment <= 20 * watchPolicy(j.watch.id)!.units)) &&
      (j.site === undefined ||
        (typeof j.site === 'string' &&
          j.kind === 'activity' &&
          j.definition === g.rules.exploreActivity &&
          g.locations.find((l) => l.id === j.target)!.sites.includes(j.site) &&
          !s.discoveries[j.target]?.sites.includes(j.site))) &&
      (!g.sites ||
        j.kind !== 'activity' ||
        j.definition !== g.rules.exploreActivity ||
        j.site !== undefined) &&
      (!activity?.mission ||
        (!!mission &&
          (!activity.locations || activity.locations.includes(j.target)) &&
          Array.isArray(s.missions) &&
          s.missions.some(
            (entry) =>
              object(entry) &&
              entry.id === mission.id &&
              !entry.claimed &&
              typeof entry.progress === 'number' &&
              entry.progress >= 0 &&
              entry.progress < mission.objective.count,
          ))) &&
      (j.kind !== 'activity' || activities.has(j.definition))
    );
  };
  if (
    !job(s.primary) ||
    !job(s.support) ||
    (s.support !== null &&
      (s.support.kind !== 'activity' ||
        g.activities.find((a) => a.id === s.support!.definition)?.slot !== 'support'))
  )
    return false;
  if (
    s.primary?.kind === 'activity' &&
    g.activities.find((a) => a.id === s.primary!.definition)?.slot !== 'primary'
  )
    return false;
  if (
    !unique(s.upgrades) ||
    !s.upgrades.every((id) => g.upgrades.some((u) => u.id === id)) ||
    !unique(s.milestones)
  )
    return false;
  if (
    !Array.isArray(s.crew) ||
    s.crew.length > 1000 ||
    !s.crew.every((member) => object(member)) ||
    !Number.isSafeInteger(s.recruitSerial) ||
    s.recruitSerial > 1000 ||
    s.recruitSerial < 0 ||
    !g.initial.crew.every((member) => s.crew.some((candidate) => candidate?.id === member.id)) ||
    living(s).length > crewCapacity(g, s) ||
    new Set(s.crew.map((c) => c?.id)).size !== s.crew.length ||
    !s.crew.every(
      (c) =>
        object(c) &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.skill === 'string' &&
        (schema === 3 ||
          (Number.isInteger(c.experience) &&
            finite(c.experience) &&
            c.experience <= EXPERIENCE_CAP)) &&
        (g.initial.crew.some(
          (x) =>
            x.id === c.id && x.name === c.name && x.skill === c.skill && c.recruit === undefined,
        ) ||
          (g.recruitment?.offers ?? []).some((offer) => {
            if (c.recruit !== offer.id || !c.id.startsWith(offer.id + '-')) return false;
            const serial = Number(c.id.slice(offer.id.length + 1));
            return (
              Number.isInteger(serial) &&
              serial >= 0 &&
              serial < s.recruitSerial &&
              c.id === `${offer.id}-${serial}` &&
              c.name === recruitName(offer, s.seed, serial) &&
              c.skill === offer.skill
            );
          })) &&
        ['alive', 'dead'].includes(c.life ?? '') &&
        ['primary', 'support', 'rest'].includes(c.assignment) &&
        finite(c.injury) &&
        c.injury <= 1,
    )
  )
    return false;
  if (
    !unique(s.threatHistory) ||
    !s.threatHistory.every((id) => g.threats?.some((t) => t.id === id))
  )
    return false;
  if (
    s.threat !== null &&
    (!object(s.threat) ||
      !g.threats?.some((t) => t.id === s.threat!.id) ||
      !['hidden', 'suspected', 'located', 'contained'].includes(s.threat.stage) ||
      !finite(s.threat.pressure) ||
      !Number.isInteger(s.threat.pressure) ||
      !finite(s.threat.signs) ||
      !Number.isInteger(s.threat.signs) ||
      !s.threatHistory.includes(s.threat.id))
  )
    return false;
  if (
    !Number.isSafeInteger(s.discoveryCooldown) ||
    s.discoveryCooldown < 0 ||
    s.discoveryCooldown > (g.discoveryEvents?.cooldown ?? 0) ||
    !Array.isArray(s.incidents) ||
    s.incidents.length > (g.discoveryEvents?.entries.length ?? 0) ||
    new Set(s.incidents.map((record) => record?.id)).size !== s.incidents.length ||
    new Set(s.incidents.map((record) => JSON.stringify([record?.location, record?.site]))).size !==
      s.incidents.length ||
    !s.incidents.every((record) => {
      if (!object(record)) return false;
      const def = g.discoveryEvents?.entries.find((entry) => entry.id === record.id);
      const recruitment =
        def?.kind === 'choice' ? def.choices.filter((choice) => choice.recruit) : [];
      if (recruitment.length) {
        if (
          !finite(record.recruitSerial) ||
          !Number.isInteger(record.recruitSerial) ||
          record.recruitSerial >= s.recruitSerial ||
          s.incidents.filter((other) => other.recruitSerial === record.recruitSerial).length !== 1
        )
          return false;
        const serial = record.recruitSerial;
        const choice = recruitment.find((choice) => choice.id === record.choice);
        const members = s.crew.filter(
          (member) => member.recruit && member.id === `${member.recruit}-${serial}`,
        );
        if (
          choice
            ? members.length !== 1 || members[0].recruit !== choice.recruit
            : members.length > 0
        )
          return false;
      } else if (record.recruitSerial !== undefined) return false;
      return (
        !!def &&
        typeof record.location === 'string' &&
        locations.has(record.location) &&
        s.known.includes(record.location) &&
        typeof record.site === 'string' &&
        s.discoveries[record.location]?.sites.includes(record.site) &&
        (!def.locations || def.locations.includes(record.location)) &&
        finite(record.at) &&
        record.at <= s.elapsed &&
        (def.kind === 'exposure'
          ? record.choice === null && s.threatHistory.includes(def.threat)
          : record.choice === null || def.choices.some((choice) => choice.id === record.choice))
      );
    }) ||
    s.incidents.filter(
      (record) =>
        record.choice === null &&
        g.discoveryEvents?.entries.some((def) => def.id === record.id && def.kind === 'choice'),
    ).length > 1
  )
    return false;
  if (
    !Array.isArray(s.missions) ||
    new Set(s.missions.map((m) => m?.id)).size !== s.missions.length ||
    !s.missions.every(
      (m) =>
        object(m) &&
        g.missions.some(
          (x) =>
            x.id === m.id &&
            missionDiscovered(g, s, x) &&
            Number.isInteger(m.progress) &&
            m.progress >= 0 &&
            m.progress <= x.objective.count,
        ) &&
        typeof m.claimed === 'boolean',
    )
  )
    return false;
  if (
    !Array.isArray(s.events) ||
    s.events.length > 100 ||
    !s.events.every(
      (e) =>
        object(e) &&
        Number.isInteger(e.id) &&
        e.id >= 0 &&
        e.id < s.nextEvent &&
        finite(e.at) &&
        typeof e.key === 'string' &&
        object(e.params) &&
        Object.values(e.params).every(
          (v) => typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)),
        ),
    )
  )
    return false;
  if (
    s.encounter !== null &&
    (!object(s.encounter) ||
      typeof s.encounter.id !== 'string' ||
      !g.factions.some((f) => f.id === s.encounter!.source) ||
      !finite(s.encounter.strength) ||
      (s.encounter.round !== undefined && !finite(s.encounter.round)))
  )
    return false;
  return true;
}
/** Only the current schema may enter a running simulation. */
export function validateState(value: unknown, g: GameDefinition): value is GameState {
  return validateStateSchema(value, g, 5);
}
/** JSON saves are portable, inspectable, and guarded against accidental corruption. */
export function encodeSave(state: GameState, savedAt: number): string {
  const payload = { format: 'exploration-save' as const, version: 1 as const, savedAt, state };
  return JSON.stringify({ ...payload, checksum: checksum(JSON.stringify(payload)) });
}
export function decodeSave(text: string, definition: DefinitionFactory): LoadedSave {
  if (text.length > 1_000_000) throw Error('Save exceeds the supported size.');
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    throw Error('This is not valid save JSON.');
  }
  if (
    !object(v) ||
    v.format !== 'exploration-save' ||
    v.version !== 1 ||
    !finite(v.savedAt) ||
    !object(v.state) ||
    !Number.isInteger(v.state.seed) ||
    !Number.isInteger(v.state.generationVersion)
  )
    throw Error('Unsupported save format or version.');
  const payload = { format: v.format, version: v.version, savedAt: v.savedAt, state: v.state };
  if (checksum(JSON.stringify(payload)) !== v.checksum)
    throw Error('Save checksum failed. Keep the original export and try again.');
  const g = definition(v.state.seed as number, v.state.generationVersion as number);
  // Verify the original checksum above before migrating legacy checkpoint fields.
  if (v.state.version === 1) {
    v.state = {
      ...v.state,
      version: 2,
      recruitSerial: 0,
      threat: null,
      threatHistory: [],
      crew: Array.isArray(v.state.crew)
        ? v.state.crew.map((member) => (object(member) ? { ...member, life: 'alive' } : member))
        : v.state.crew,
    };
  }
  if (object(v.state) && v.state.version === 2) {
    v.state = { ...v.state, version: 3, incidents: [], discoveryCooldown: 0 };
  }
  if (object(v.state) && v.state.version === 3) {
    if (!validateStateSchema(v.state, g, 3)) throw Error('Legacy save state is invalid.');
    const previous = v.state;
    v.state = {
      ...previous,
      version: 4,
      crew: previous.crew.map((member) => ({ ...member, experience: 0 })),
      primary:
        previous.primary?.kind === 'activity'
          ? {
              ...previous.primary,
              participants: activityParticipants(
                previous,
                g.activities.find((a) => a.id === previous.primary!.definition)!,
              ),
            }
          : previous.primary,
      support: previous.support
        ? {
            ...previous.support,
            participants: activityParticipants(
              previous,
              g.activities.find((a) => a.id === previous.support!.definition)!,
            ),
          }
        : null,
    };
  }
  if (object(v.state) && v.state.version === 4) {
    if (!validateStateSchema(v.state, g, 4)) throw Error('Legacy save state is invalid.');
    v.state = { ...v.state, version: 5 };
  }
  if (!validateState(v.state, g))
    throw Error('Save state is invalid or its content generation version is unsupported.');
  return { state: v.state, savedAt: v.savedAt };
}
/** Move the checkpoint forward even when paused; absence never accumulates behind a decision. */
export function reconcile(g: GameDefinition, loaded: LoadedSave, now: number): LoadedSave {
  const gap = Number.isFinite(now) ? Math.max(0, (now - loaded.savedAt) / 1000) : 0;
  return {
    state: advance(g, loaded.state, gap),
    savedAt: Number.isFinite(now) ? Math.max(now, loaded.savedAt) : loaded.savedAt,
    awaySeconds: Math.min(gap, OFFLINE_CAP),
  };
}
