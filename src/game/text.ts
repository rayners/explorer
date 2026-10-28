import { nameReferences } from '../content/names';
import type { GameDefinition, GameEvent, GameState } from '../engine/types';
export function describeEvent(g: GameDefinition, e: GameEvent): string {
  const p = e.params,
    location = (id: unknown) => g.locations.find((l) => l.id === id)?.name ?? String(id ?? ''),
    activity = g.activities.find((a) => a.id === p.activity)?.name ?? p.activity,
    mission = g.missions.find((m) => m.id === p.mission)?.name ?? p.mission;
  const messages: Record<string, string> = {
    discoveryFound: `At ${location(p.target)}: ${g.discoveryEvents?.entries.find((entry) => entry.id === p.discovery)?.title ?? 'a discovery'}. Bring the records to a station to choose their future. Operations can continue.`,
    discoverySettled: (() => {
      const def = g.discoveryEvents?.entries.find((entry) => entry.id === p.discovery);
      const choice =
        def?.kind === 'choice' ? def.choices.find((entry) => entry.id === p.choice) : undefined;
      return `${def?.title ?? 'Discovery'}: ${choice?.name ?? p.choice}. The decision is recorded; the chosen effects have been applied.`;
    })(),
    memberHired: `${p.member} joined the crew as ${p.skill}. Assign them to a team in Operations.`,
    memberLost: `${p.member} was killed by the shipboard threat. Their place in the manifest is now a memorial.`,
    threatAnomaly:
      'Cargo mass differs from the expedition report. The biofilter has requested an unscheduled cycle.',
    threatRevealed:
      'Internal movement detected. A lifeform is aboard the Kestrel. Operations hold for your response.',
    threatLocated:
      'Security has located the unmanifested lifeform. Containment or direct confrontation is possible.',
    threatContained:
      'Bulkheads sealed. The lifeform is contained; normal operations can resume, but it is still aboard.',
    threatEvaded:
      'The contact slipped away. Security lost the trace. Another failed response may provoke an attack.',
    threatRescued: `${p.member} was attacked. The support medic kept them alive; treatment is still needed.`,
    threatStopped:
      p.method === 'purge'
        ? 'Contaminated cargo section vented. The organism is gone.'
        : 'The creature has been stopped. The ship is clear.',
    jobAbandoned: 'A team lost its last surviving member. Its unfinished job has been abandoned.',
    welcome:
      'Charter FW-017 activated. Welcome aboard the survey vessel Kestrel. There is a lot of sky left.',
    departed: `Course laid in for ${location(p.target)}. ${p.days} ship-calendar days to arrival.`,
    arrived: `Arrived at ${location(p.target)}. ${p.days} days have passed beyond the hull.`,
    activityStarted: `${activity}${p.watch ? ` · ${p.minutes}-minute extended order` : ''} underway.`,
    activityComplete: `${activity}${p.watch ? ` · ${p.minutes}-minute extended order` : ''} complete at ${location(p.target)}.`,
    workWatchCancelled:
      'Extended station shift cancelled. No pay, debt repayment or practice was earned.',
    surveyed: `Survey of ${location(p.target)} complete. ${p.count} new navigation contacts resolved.`,
    siteExplored: `At ${location(p.target)}: ${g.sites?.find((site) => site.id === p.site)?.name ?? p.site}. Records and salvage secured.`,
    missionAbandoned: `Contract released: ${mission}.`,
    missionAccepted: `Contract accepted: ${mission}.`,
    missionClaimed: `Contract filed: ${mission}. Payment received.`,
    trade: `${p.direction === 'buy' ? 'Purchased' : 'Sold'} ${p.amount} ${g.resources.find((r) => r.id === p.resource)?.name.toLowerCase() ?? p.resource}.`,
    cargoFull: `Cargo limit reached. ${p.lost} units could not be recovered.`,
    rescueRequested: 'Recovery tug dispatched. A 150 credit debt has been added to your account.',
    rescued: `Recovery tow complete. Docked at ${location(p.target)}.`,
    intercepted:
      'Unregistered contact closing. All consequential operations paused pending your orders.',
    hazard: 'Field incident. Hull damage sustained; one crew member needs treatment.',
    combatWon:
      'Hostile contact neutralized. Salvage recovered. {faction:independent} recognize the clearance.',
    combatDamage: 'Incoming fire. Hull damage sustained. Your next order is required.',
    escapedDamaged: 'Contact broken. Hull damage logged for the next maintenance window.',
    escaped: 'Contact evaded. Resuming operations.',
    bargained: 'Safe passage purchased. {faction:pirates} remember who pays.',
    surrendered: 'Cargo surrendered. Crew and vessel are safe.',
    dataSold: `${p.count} survey records licensed exclusively to ${g.factions.find((f) => f.id === p.faction)?.name ?? 'the station'}. Rival claims have been weakened.`,
    upgraded: `Installed: ${g.upgrades.find((u) => u.id === p.upgrade)?.name ?? p.upgrade}.`,
    milestone:
      p.milestone === 'interstellar'
        ? 'First interstellar crossing recorded. While you slept, the frontier grew older.'
        : 'Frontier charter fulfilled: ten bodies surveyed. There is still more to find.',
  };
  return nameReferences(g, messages[e.key] ?? e.key);
}
function baseGuidance(s: GameState): { title: string; text: string; tab: string } {
  if (s.threat && s.threat.stage !== 'hidden')
    return {
      title: 'Something is aboard.',
      text: 'Coordinate security, engineering and medical staff. You can always vent the affected cargo section to remove the threat safely.',
      tab: 'operations',
    };
  if (s.encounter)
    return {
      title: 'A contact wants your attention.',
      text: 'Operations are holding. Choose how to handle the encounter below.',
      tab: 'overview',
    };
  if (s.primary?.kind === 'travel')
    return {
      title: s.primary.days >= 365 ? 'The long dark.' : 'A little further out.',
      text: 'Your course is committed. The ship will arrive while this tab is closed. Support work can run during the crossing.',
      tab: 'operations',
    };
  if (s.incidents.some((record) => record.id === 'settlement-claim' && record.choice === null))
    return {
      title: 'A discovery with a future.',
      text: 'Carry the recovered settlement claim to a station. Choose who receives it in the discovery panel; you can continue exploring meanwhile.',
      tab: 'contacts',
    };
  if (!s.missions.some((m) => m.id === 'first-light'))
    return {
      title: 'Every chart starts somewhere.',
      text: 'Accept “First light” from the station board. Then plot a course to {location:cinder}, the rust-colored world below.',
      tab: 'contacts',
    };
  if (!s.discoveries.cinder?.surveyed)
    return {
      title:
        s.location === 'cinder'
          ? 'Look before you land.'
          : 'Your first heading: {location:cinder}.',
      text:
        s.location === 'cinder'
          ? 'Run an orbital survey. It will resolve surface sites and new navigation contacts.'
          : 'Open Navigation and select {location:cinder}. Check the fuel cost, then commit the course.',
      tab: s.location === 'cinder' ? 'operations' : 'navigation',
    };
  if (!s.missions.some((m) => m.id === 'first-light' && m.claimed))
    return {
      title: 'Bring the findings home.',
      text: 'Return to a station and file “First light” in Contacts. Your survey has opened routes deeper into the frontier.',
      tab: 'contacts',
    };
  if (!s.milestones.includes('interstellar'))
    return {
      title: 'The edge is a direction.',
      text: 'Explore local sites, build reserves, and follow a resolved interstellar route. Once charted, {region:pale} can be reached from anywhere in {region:vesper}.',
      tab: 'navigation',
    };
  return {
    title: 'Make a little more of the unknown known.',
    text: 'Survey ten bodies to fulfill the frontier charter. Decide who gets the data, and keep enough propellant to get home.',
    tab: 'navigation',
  };
}

export function guidance(
  g: GameDefinition,
  s: GameState,
): { title: string; text: string; tab: string } {
  const guide = baseGuidance(s);
  return { ...guide, title: nameReferences(g, guide.title), text: nameReferences(g, guide.text) };
}
