import type { Command, GameDefinition, GameState } from '../engine/types';
import { living, crewCapacity, recruitName } from '../engine/personnel';
import { dispatch } from '../engine/simulation';
import { EXPERIENCE_CAP } from '../engine/proficiency';
import { pendingDiscovery } from '../engine/discoveries';
export type CommandButton = (label: string, command: Command, primary?: boolean) => string;
const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function recruitmentPanel(g: GameDefinition, s: GameState, button: CommandButton): string {
  if (!g.recruitment) return '';
  return `<section class="panel"><div class="panel-head"><h2>Recruit specialists</h2><span class="eyebrow">${living(s).length} / ${crewCapacity(g, s)} PLACES</span></div><div class="panel-body"><p>Accommodation limits your active company. New recruits start resting; assign them to a team. Casualties remain in the memorial and free their place.</p><div class="activity-grid">${g.recruitment.offers
    .filter((o) => !o.emergency || living(s).length === 0)
    .map((offer) => {
      const command: Command = { type: 'hire', id: offer.id },
        error = dispatch(g, s, command).error;
      return `<article class="activity-card"><h3>${esc(offer.name)}</h3><small>${esc(recruitName(offer, s.seed, s.recruitSerial))} · ${esc(offer.skill)}</small><p>${esc(offer.description)}</p><div class="cost">${
        Object.entries(offer.cost)
          .map(([id, n]) => `${n} ${esc(g.resources.find((r) => r.id === id)?.name)}`)
          .join(' · ') || 'Emergency assistance · no cost'
      }</div>${button('Recruit ' + offer.name, command, !error)}${error ? `<small>${esc(error)}</small>` : ''}</article>`;
    })
    .join('')}</div></div></section>`;
}
export function threatPanel(
  g: GameDefinition,
  s: GameState,
  button: CommandButton,
  purgeLabel = 'Purge contaminated stores',
): string {
  if (!s.threat || s.threat.stage === 'hidden') return '';
  const def = g.threats!.find((t) => t.id === s.threat!.id)!;
  return `<section class="encounter threat-panel"><div class="eyebrow accent">${s.threat.stage === 'contained' ? 'CONTAINED / OPERATIONS AVAILABLE' : 'INTERNAL THREAT / OPERATIONS HOLDING'}</div><h2>${esc(def.name)}</h2><p>${esc(def.description)}</p><p class="danger">Responses can cause permanent casualties. Failed responses before the next attack: ${Math.max(1, def.attackAfter - s.threat.pressure)}. Time away does not resolve responses or kill members.</p><p>Primary ${esc(def.searchSkill)} and support ${esc(def.supportSkill)} improve searches and containment. Support ${esc(def.medicalSkill)} can prevent a fatality. Status: ${esc(s.threat.stage)}.</p><div class="encounter-actions">${(
    ['search', 'contain', 'confront', 'purge'] as const
  )
    .map(
      (action) =>
        `<div>${button(action === 'search' ? 'Search for threat' : action === 'contain' ? 'Contain threat' : action === 'confront' ? 'Confront threat' : purgeLabel, { type: 'threat', action }, action === 'search')}<small style="display:block;margin-top:6px">${
          action === 'purge'
            ? `Guaranteed resolution; lose ${Math.round(def.purgeLoss * 100)}% of physical cargo. No casualties.`
            : Object.entries(
                action === 'search'
                  ? def.searchCost
                  : action === 'contain'
                    ? def.containCost
                    : def.combatCost,
              )
                .map(
                  ([id, n]) =>
                    `${n} ${esc(g.resources.find((r) => r.id === id)?.name.toLowerCase())}`,
                )
                .join(' · ')
        }</small></div>`,
    )
    .join('')}</div></section>`;
}

/** A nonurgent discovery stays visible until it is settled; hidden exposures never render. */
export function discoveryPanel(
  g: GameDefinition,
  s: GameState,
  button: CommandButton,
  reviewButton?: string,
): string {
  const record = pendingDiscovery(g, s);
  const def = g.discoveryEvents?.entries.find((entry) => entry.id === record?.id);
  if (!record || def?.kind !== 'choice') return '';
  if (reviewButton)
    return `<section class="panel discovery-panel" aria-labelledby="discovery-title"><div class="panel-head"><h2 id="discovery-title">${esc(def.title)}</h2><span class="eyebrow">DISCOVERY / FOLLOW-UP</span></div><div class="panel-body"><p>Records recovered at ${esc(g.locations.find((l) => l.id === record.location)?.name)}. A decision is waiting; work and travel can continue.</p><div class="row-actions">${reviewButton}</div></div></section>`;
  const effects = (amounts: Record<string, number>, names: { id: string; name: string }[]) =>
    Object.entries(amounts)
      .map(
        ([id, value]) =>
          `${value > 0 ? '+' : ''}${value} ${esc(names.find((n) => n.id === id)?.name ?? id)}`,
      )
      .join(' · ');
  return `<section class="panel discovery-panel" aria-labelledby="discovery-title"><div class="panel-head"><h2 id="discovery-title">${esc(def.title)}</h2><span class="eyebrow">DISCOVERY / FOLLOW-UP</span></div><div class="panel-body"><p>${esc(def.description)}</p><p>Recovered at ${esc(g.locations.find((l) => l.id === record.location)?.name)}: ${esc(g.sites?.find((site) => site.id === record.site)?.name ?? record.site)}. You can continue exploring; this choice will wait.</p><div class="activity-grid">${def.choices
    .map((choice) => {
      const command: Command = { type: 'discovery', id: def.id, choice: choice.id };
      const offer = choice.recruit
        ? g.recruitment?.offers.find((offer) => offer.id === choice.recruit)
        : undefined;
      const personnel =
        offer && record.recruitSerial !== undefined
          ? `<p>Joins resting: <strong>${esc(recruitName(offer, s.seed, record.recruitSerial))}</strong> · ${esc(offer.name)}. Uses one accommodation place.</p>`
          : choice.training
            ? `<p>Training: ${esc(choice.training.skill)} · +${choice.training.points} practice per living specialist (limit ${EXPERIENCE_CAP}).</p><p>${
                living(s)
                  .filter((member) => member.skill === choice.training!.skill)
                  .map(
                    (member) =>
                      `${esc(member.name)}: ${member.experience ?? 0} → ${Math.min(EXPERIENCE_CAP, (member.experience ?? 0) + choice.training!.points)}`,
                  )
                  .join(' · ') || 'No matching living specialist.'
              }</p>`
            : '';
      const error = dispatch(g, s, command).error;
      return `<article class="activity-card"><h3>${esc(choice.name)}</h3><p>${esc(choice.description)}</p>${personnel}<p class="cost">${effects(choice.reward, g.resources) || 'No payment'}<br>${effects(choice.reputation, g.factions) || 'No standing change'}</p>${button(choice.name, command)}${error ? `<small>${esc(error)}</small>` : ''}</article>`;
    })
    .join(
      '',
    )}</div><small>Faction standing persists and affects port prices and access to work. Each discovery can be settled once.</small></div></section>`;
}

export function discoveryHistory(g: GameDefinition, s: GameState): string {
  const records = s.incidents.flatMap((record) => {
    const def = g.discoveryEvents?.entries.find((entry) => entry.id === record.id);
    if (def?.kind !== 'choice' || !record.choice) return [];
    const choice = def.choices.find((entry) => entry.id === record.choice)!;
    return [
      `<p><strong>${esc(def.title)}</strong> · ${esc(choice.name)}<br><small>${esc(g.locations.find((l) => l.id === record.location)?.name)} · ${esc(g.sites?.find((site) => site.id === record.site)?.name ?? record.site)}</small></p>`,
    ];
  });
  return records.length
    ? `<section class="panel discovery-history"><div class="panel-head"><h2>Discovery record</h2></div><div class="panel-body">${records.join('')}</div></section>`
    : '';
}
