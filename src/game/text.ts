import type { GameDefinition, GameEvent, GameState } from '../engine/types';
export function describeEvent(g: GameDefinition, e: GameEvent): string {
  const p = e.params,
    location = (id: unknown) => g.locations.find((l) => l.id === id)?.name ?? String(id ?? ''),
    activity = g.activities.find((a) => a.id === p.activity)?.name ?? p.activity,
    mission = g.missions.find((m) => m.id === p.mission)?.name ?? p.mission;
  const messages: Record<string, string> = {
    welcome:
      'Charter FW-017 activated. Welcome aboard the survey vessel Kestrel. There is a lot of sky left.',
    departed: `Course laid in for ${location(p.target)}. ${p.days} ship-calendar days to arrival.`,
    arrived: `Arrived at ${location(p.target)}. ${p.days} days have passed beyond the hull.`,
    activityStarted: `${activity} underway.`,
    activityComplete: `${activity} complete at ${location(p.target)}.`,
    surveyed: `Survey of ${location(p.target)} complete. ${p.count} new navigation contacts resolved.`,
    siteExplored: `At ${location(p.target)}: ${p.site}. Records and salvage secured.`,
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
      'Hostile contact neutralized. Salvage recovered. The Free Habitats recognize the clearance.',
    combatDamage: 'Incoming fire. Hull damage sustained. Your next order is required.',
    escapedDamaged: 'Contact broken. Hull damage logged for the next maintenance window.',
    escaped: 'Contact evaded. Resuming operations.',
    bargained: 'Safe passage purchased. The Unregistered remember who pays.',
    surrendered: 'Cargo surrendered. Crew and vessel are safe.',
    dataSold: `${p.count} survey records licensed exclusively to ${g.factions.find((f) => f.id === p.faction)?.name ?? 'the station'}. Rival claims have been weakened.`,
    upgraded: `Installed: ${g.upgrades.find((u) => u.id === p.upgrade)?.name ?? p.upgrade}.`,
    milestone:
      p.milestone === 'interstellar'
        ? 'First interstellar crossing recorded. While you slept, the frontier grew older.'
        : 'Frontier charter fulfilled: ten bodies surveyed. There is still more to find.',
  };
  return messages[e.key] ?? e.key;
}
export function guidance(s: GameState): { title: string; text: string; tab: string } {
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
  if (!s.missions.some((m) => m.id === 'first-light'))
    return {
      title: 'Every chart starts somewhere.',
      text: 'Accept “First light” from the station board. Then plot a course to Cinder, the rust-colored world below.',
      tab: 'contacts',
    };
  if (!s.discoveries.cinder?.surveyed)
    return {
      title: s.location === 'cinder' ? 'Look before you land.' : 'Your first heading: Cinder.',
      text:
        s.location === 'cinder'
          ? 'Run an orbital survey. It will resolve surface sites and new navigation contacts.'
          : 'Open Navigation and select Cinder. Check the fuel cost, then commit the course.',
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
      text: 'Explore local sites, build reserves, and follow a resolved interstellar route. At Cinder, a course to the Pale Reach is waiting.',
      tab: 'navigation',
    };
  return {
    title: 'Make a little more of the unknown known.',
    text: 'Survey ten bodies to fulfill the frontier charter. Decide who gets the data, and keep enough propellant to get home.',
    tab: 'navigation',
  };
}
