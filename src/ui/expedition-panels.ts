import type { Command, GameDefinition, GameState } from '../engine/types';
import { living, crewCapacity, recruitName } from '../engine/personnel';
import { dispatch } from '../engine/simulation';
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
