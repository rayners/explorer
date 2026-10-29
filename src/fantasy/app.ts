import { destinationPanel, focusContractBrief } from '../ui/destination-panels';
import { mountTelemetryPreference } from '../browser/telemetry';
import { duration as time } from '../ui/time';
import { planningSummary, projectOffers, routePlanPanel } from '../ui/planning-panels';
import { proficiencyLabel, proficiencyHelp } from '../ui/proficiency';
import { chartLines } from '../ui/world-map';
import { workWatchPanel, watchCommitment, watchLabel } from '../ui/work-watches';
import { missionDiscovered } from '../engine/missions';
import { followUpBrief, followUpWork, boundWorkCard } from '../ui/mission-panels';
import { activityPreview, sitePanel } from '../ui/site-panels';
import type { GameDefinition, GameState, Command, Job } from '../engine/types';
import type { AppController } from '../browser/controller';
import { dispatch, view, cargo, price, activityDuration, routesFrom } from '../engine/simulation';
import { living, crewCapacity } from '../engine/personnel';
import { planRoute } from '../engine/navigation';
import { threatAlert } from '../engine/threats';
import {
  recruitmentPanel,
  threatPanel,
  discoveryPanel,
  discoveryHistory,
} from '../ui/expedition-panels';
import { drawFantasyScene } from './art';
import { fantasyGuidance } from './guidance';
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const panel = (title: string, body: string) =>
  `<section class="panel"><div class="panel-head"><h2>${title}</h2></div><div class="panel-body">${body}</div></section>`;
export function mountFantasy(root: HTMLElement, controller: AppController) {
  let g: GameDefinition,
    s: GameState,
    tab = 'chronicle',
    region = 'hearth',
    lastRegion = '',
    plannedTarget: string | null = null,
    signature = '',
    toast: ReturnType<typeof setTimeout>,
    confirmAction: (() => void) | null = null,
    returnFocus: HTMLElement | null = null;
  root.innerHTML = `<a class="skip-link" href="#main-content">Skip to company ledger</a><div class="app-shell"><aside class="sidebar"><div class="wordmark"><span class="sigil" aria-hidden="true">♜</span><div class="brand">HOLLOW<br>MERE<small>BEYOND THE LAST LANTERN</small></div></div><div class="charter">THE COMPANY LEDGER / I</div><nav class="navigation" aria-label="Company ledger">${[
    ['chronicle', 'Chronicle', '◇'],
    ['journey', 'Journey', '⌖'],
    ['company', 'Company', '♜'],
    ['refuge', 'Refuge', '⌂'],
  ]
    .map(
      ([id, label, glyph]) =>
        `<button class="nav-button" data-tab="${id}"><span aria-hidden="true">${glyph}</span>${label}</button>`,
    )
    .join(
      '',
    )}</nav><div class="sidebar-bottom"><p>The forest keeps its own accounts.</p><div class="ship-id"><small>KEEP THE LANTERNS LIT.<br>BRING SOMEONE HOME.</small></div><button data-action="settings" class="quiet" style="width:100%;margin-top:20px">Company settings</button><a class="other-game" href="../?games=1">All games</a></div></aside><div class="main-wrap"><header class="topbar"><div><div class="eyebrow">HOLLOWMERE / THE COMPANY LEDGER</div><small id="breadcrumb"></small></div><div class="topbar-right"><a class="library-link" href="../?games=1">All games</a><span id="save-status" class="eyebrow storage-label"></span><button class="quiet" data-action="settings" aria-label="Settings">☷</button></div></header><div id="save-warning" class="save-warning" role="alert" hidden><span></span><button data-action="settings">Save settings</button></div><main class="page" id="main-content" tabindex="-1"></main></div></div><div class="notice" role="status" aria-live="polite"></div><dialog id="settings-dialog" aria-labelledby="settings-title"><div class="flex between"><h2 id="settings-title">Company records</h2><button data-action="close" aria-label="Close settings">×</button></div><p>Hollowmere has its own save, separate from Far Wake. Export before changing devices.</p><label><input type="checkbox" id="sound"> Quiet sounds</label><label><input type="checkbox" id="motion"> Reduced motion</label><div class="settings-actions"><button data-action="export">Export to text</button><button data-action="download">Download save</button><button data-action="backup">Load local backup</button></div><textarea id="save-text" aria-label="Save JSON" placeholder="Paste an exported Hollowmere save."></textarea><button data-action="import">Import pasted save</button><p id="settings-error" class="dialog-error" role="status"></p><div class="line"></div><p>Activities continue while you are away, up to 24 hours. Encounters and revealed curses wait for your decisions. Only explicit threat responses can kill companions. Death is permanent; new companions can be recruited at refuges. Expand Longer refuge duties in Company for one 15-minute, one-hour or eight-hour order. Cancellation forfeits all its pay and practice; short work pays more per minute.</p><p>Fighters lead expeditions, mages unravel wards, clerics heal and consecrate, and scouts improve gathering. Assign classes to Expedition or Support according to the task.</p><p>New companies generate companion, faction and place names from the seed. Use a different seed for different names. Your current names stay with this save.</p><label for="new-seed">New company seed</label><input type="number" id="new-seed" value="1701" min="0" max="4294967295" step="1"><div class="settings-actions"><button data-action="reset" class="danger">Start a new company</button></div><p><a href="../far-wake/">Play Far Wake — a science fiction expedition</a></p></dialog><dialog id="confirm-dialog" aria-labelledby="confirm-title"><h2 id="confirm-title">Commit the company?</h2><p id="confirm-description"></p><div class="row-actions"><button data-action="confirm" class="primary">Confirm order</button><button data-action="cancel">Keep current orders</button></div></dialog>`;
  mountTelemetryPreference(root.querySelector('#settings-dialog')!);
  const main = root.querySelector<HTMLElement>('main')!,
    settings = root.querySelector<HTMLDialogElement>('#settings-dialog')!,
    confirm = root.querySelector<HTMLDialogElement>('#confirm-dialog')!;
  const notify = (message: string) => {
    root.querySelector('.notice')!.textContent = message;
    clearTimeout(toast);
    toast = setTimeout(() => (root.querySelector('.notice')!.textContent = ''), 6500);
  };
  const amounts = (values: Record<string, number>) =>
    Object.entries(values)
      .map(([id, n]) => `${n} ${g.resources.find((r) => r.id === id)?.name.toLowerCase() ?? id}`)
      .join(' · ') || 'No supplies required';
  function button(label: string, command: Command, primary = false, includeReason = true) {
    const error = dispatch(g, s, command).error;
    return `<button data-command="${esc(JSON.stringify(command))}" data-key="${esc(JSON.stringify(command))}" class="${primary ? 'primary' : ''}" ${error || !controller.isOwner() ? 'disabled' : ''}>${esc(label)}</button>${error && includeReason ? `<small class="action-reason">${esc(error)}</small>` : ''}`;
  }
  function jobName(job: Job) {
    return job.kind === 'travel'
      ? `Journey to ${g.locations.find((l) => l.id === job.target)!.name}`
      : job.kind === 'rescue'
        ? 'Escort to refuge'
        : g.activities.find((a) => a.id === job.definition)!.name +
          (job.watch ? ` · ${watchLabel(job.watch.id)}` : '') +
          (job.site ? ` · ${g.sites?.find((site) => site.id === job.site)?.name ?? job.site}` : '');
  }
  function jobs() {
    return (['primary', 'support'] as const)
      .map((slot) => {
        const job = s[slot];
        return job
          ? `<section class="active-job"><div class="flex between"><h3>${esc(jobName(job))}</h3><span class="job-time" data-timer="${slot}">${time(job.remaining)}</span></div><div class="meter amber"><span data-progress="${slot}" style="width:${100 * (1 - job.remaining / job.total)}%"></span></div><small>${slot === 'primary' ? 'EXPEDITION' : 'SUPPORT'} · ${s.encounter || threatAlert(s) ? 'WAITING FOR YOUR ORDERS' : 'PROGRESS CONTINUES WHILE YOU ARE AWAY'}</small>${watchCommitment(g, s, job, (label, command, primary) => button(label, command, primary, false), 'End extended duty')}</section>`
          : '';
      })
      .join('');
  }
  function describe(event: GameState['events'][number]) {
    const p = event.params,
      location = g.locations.find((l) => l.id === p.target)?.name ?? p.target,
      activity = g.activities.find((a) => a.id === p.activity)?.name ?? p.activity,
      mission = g.missions.find((m) => m.id === p.mission)?.name ?? p.mission;
    const text: Record<string, string> = {
      welcome: `The company gathered at ${g.locations.find((l) => l.id === 'mournwatch')!.name}. The lanterns are lit. The names have been entered.`,
      departed: `The road to ${location} is taken.`,
      arrived: `The company reached ${location}.`,
      activityStarted: `${activity}${p.watch ? ` · ${p.minutes}-minute extended duty` : ''} begun.`,
      activityComplete: `${activity}${p.watch ? ` · ${p.minutes}-minute extended duty` : ''} completed at ${location}.`,
      workWatchCancelled:
        'Extended refuge duty ended early. No pay, debt repayment or practice was earned.',
      surveyed: `${location} charted. ${p.count} paths and places revealed.`,
      siteExplored: `At ${location}: ${g.sites?.find((site) => site.id === p.site)?.name ?? p.site}. Records and relics recovered.`,
      discoveryFound: `${location}: ${g.discoveryEvents?.entries.find((entry) => entry.id === p.discovery)?.title ?? 'a discovery'}. Bring the records to a refuge; ordinary work can continue.`,
      discoverySettled: `The discovery response is recorded. Its effects have been applied.`,
      memberHired: `${p.member} joined the company as ${p.skill}. Assign them before setting out.`,
      memberLost: `${p.member} was killed by the White Guest. Their name remains in the ledger.`,
      threatAnomaly: 'An extra shadow fell across the campfire. Nobody could find its owner.',
      threatRevealed: 'The White Guest walks among the company. All work holds for your decision.',
      threatLocated: 'The company found the shrouded shape. It can now be confronted.',
      threatContained: 'The binding holds. Ordinary work may resume, but the Guest remains.',
      threatEvaded: 'The Guest slipped away. Another failed response may draw an attack.',
      threatRescued: `${p.member} was attacked. A cleric kept them alive.`,
      threatStopped: 'The White Guest has been banished. Its place by the fire is empty.',
      jobAbandoned: 'A team lost its last member. Unfinished work was abandoned.',
      missionAccepted: `Oath taken: ${mission}.`,
      missionClaimed: `Oath fulfilled: ${mission}. Payment received.`,
      missionAbandoned: `Oath released: ${mission}.`,
      combatWon: 'The hostile company was driven off. Supplies recovered.',
      combatDamage: 'The company was struck. Equipment damaged; another decision is needed.',
      escaped: 'The company escaped the encounter.',
      escapedDamaged: 'The company escaped with damaged equipment.',
      bargained: 'Safe passage purchased.',
      surrendered: 'Supplies surrendered. The companions survive.',
      hazard: 'A field mishap damaged equipment and injured a companion.',
      trade: `${p.direction === 'buy' ? 'Bought' : 'Sold'} ${p.amount} ${g.resources.find((r) => r.id === p.resource)?.name.toLowerCase()}.`,
      upgraded: `Acquired ${g.upgrades.find((u) => u.id === p.upgrade)?.name}.`,
      cargoFull: `Packs full. ${p.lost} bundles could not be carried.`,
      dataSold: `${p.count} field chronicles sold to a faction. Rival claims weakened.`,
      rescueRequested: 'An escort was requested. One hundred crowns of debt recorded.',
      rescued: `The company was escorted to ${location}.`,
      milestone: 'Another part of the realm is known. The ledger is not yet closed.',
    };
    return text[event.key] ?? event.key;
  }
  function log() {
    return [...s.events]
      .reverse()
      .slice(0, 8)
      .map(
        (e) =>
          `<div class="log-row"><time>+${Math.floor(e.at / 60)}m</time><span>${esc(describe(e))}</span></div>`,
      )
      .join('');
  }
  function encounter() {
    return s.encounter
      ? `<section class="encounter"><div class="eyebrow accent">THE OATHLESS / JOURNEY PAUSED</div><h2>Others walk this road.</h2><p>A hostile company bars the way. Fighters and mages improve combat odds. Combat can damage equipment; the company can always surrender supplies to escape.</p><div class="row-actions">${button('Fight', { type: 'encounter', choice: 'fight' }, true)}${button('Evade', { type: 'encounter', choice: 'evade' })}${button('Pay passage', { type: 'encounter', choice: 'bargain' })}${button('Surrender supplies', { type: 'encounter', choice: 'surrender' })}</div><small>Fight: 2 quivers · Evade: 2 rations · Pay: 40 crowns · Surrender: 20% of physical supplies.</small></section>`
      : '';
  }
  function actionCard(id: string) {
    const a = g.activities.find((a) => a.id === id)!,
      preview = activityPreview(g, s, id);
    if (a.mission) return boundWorkCard(g, s, id, button, 'Begin support work');
    return `<article class="activity-card"><div class="flex between"><h3>${esc(a.name)}</h3><span class="badge">${time(activityDuration(g, s, id))}</span></div><p>${esc(a.description)}</p><small>${esc(amounts(preview.cost))}</small>${preview.note ? `<p>${esc(preview.note)}</p>` : ''}${Object.keys(preview.reward).length ? `<small>Return: ${esc(amounts(preview.reward))}</small>` : ''}${button(a.slot === 'support' ? 'Begin support work' : 'Begin activity', { type: 'activity', id }, !dispatch(g, s, { type: 'activity', id }).error)}${a.id === g.rules.workActivity ? workWatchPanel(g, s, (label, command, primary) => button(label, command, primary, false), { title: 'Longer refuge duties', action: 'Begin refuge duty' }) : ''}</article>`;
  }
  function directive() {
    const guide = fantasyGuidance(g, s);
    return `<section class="directive" aria-label="Current directive"><div><h2>${esc(guide.title)}</h2><p>${esc(guide.text)}</p></div><div class="directive-action">${guide.accept ? button('Accept Beyond the last lantern', { type: 'accept', id: 'first-road' }, true) : `<button class="primary" data-tab="${guide.tab}">Open ${guide.tab}</button>`}</div></section>`;
  }
  function chronicle() {
    const v = view(g, s);
    return `${directive()}<div class="dashboard"><div class="stack"><section class="panel"><div class="panel-head"><h2>${esc(v.location.name)}</h2><span class="eyebrow">${esc(v.location.kind)}</span></div><canvas class="scene" id="fantasy-scene" role="img" aria-label="Pixel art of a lantern-bearing company at ${esc(v.location.name)}"></canvas><div class="scene-caption"><div class="location-title">${esc(v.region.name)}</div><p>${esc(v.location.description)}</p><div class="row-actions"><button class="primary" data-tab="${v.location.station ? 'journey' : 'company'}">${v.location.station ? 'Take the road' : 'Explore this place'}</button><button data-tab="refuge">Contracts & provisions</button></div></div></section>${panel('The company chronicle', log())}</div><div class="stack">${panel('At the campfire', `<div class="status-lines"><div><span>Living companions</span><b>${living(s).length} / ${crewCapacity(g, s)}</b></div><div><span>Names in memoriam</span><b>${s.crew.filter((m) => m.life === 'dead').length}</b></div><div><span>Equipment condition</span><b>${Math.round(s.integrity)}%</b></div><div><span>Equipment wear</span><b>${Math.round(s.wear)}%</b></div><div><span>Pack capacity</span><b>${cargo(g, s)} / ${s.capacity}</b></div><div><span>Escort debt</span><b>${s.debt} crowns</b></div><div><span>Places charted</span><b>${Object.entries(s.discoveries).filter(([id, d]) => d.surveyed && !g.locations.find((l) => l.id === id)!.station).length} / ${g.locations.filter((l) => !l.station).length}</b></div></div>`)}${panel('What each class brings', '<p><b>Fighters</b> lead dangerous expeditions and hold the line.</p><p><b>Mages</b> read signs, open wards, and strengthen combat.</p><p><b>Clerics</b> heal, consecrate, and can prevent a fatal curse attack from Support.</p><p><b>Scouts</b> improve gathering and help track the White Guest from Support.</p>')}</div></div>`;
  }
  function journey() {
    const current = view(g, s),
      selected = g.regions.find((r) => r.id === region)!,
      knownRegions = new Set(
        g.locations.filter((l) => s.known.includes(l.id)).map((l) => l.region),
      );
    return `${plannedTarget ? routePlanPanel(g, s, plannedTarget, button) : ''}${panel('The roads beyond', `<div class="map fantasy-map">${chartLines(g)}${g.regions.map((r) => `<button class="star-button ${r.id === region ? 'selected' : ''}" data-region="${r.id}" style="left:${r.x}%;top:${r.y}%;--star:${r.color}" aria-label="${knownRegions.has(r.id) ? r.name : 'Uncharted realm'}"><span class="star" aria-hidden="true">♜</span><small>${knownRegions.has(r.id) ? esc(r.name) : 'UNCHARTED'}</small></button>`).join('')}</div><p>Roads connect particular places: passes, sanctuaries, and woodland paths. Every leg is ordered separately.</p>`)}<div class="section-label">${esc(selected.name)} / ${esc(selected.subtitle)}</div><div class="route-list">${
      g.locations
        .filter((l) => l.region === region && s.known.includes(l.id))
        .map((l) => {
          const direct = routesFrom(g, s).find((r) => r.target === l.id),
            path = planRoute(g, s, l.id),
            first = path[0],
            here = l.id === s.location;
          const cost: Record<string, number> = {};
          for (const leg of path)
            for (const [id, n] of Object.entries(leg.cost)) cost[id] = (cost[id] ?? 0) + n;
          return `<article class="route-card"><div><h3>${esc(l.name)}${here ? ' / CURRENT' : ''}</h3><small>${esc(l.kind)} · ${s.discoveries[l.id]?.surveyed ? 'Charted' : 'Uncharted'}</small><p>${esc(l.description)}</p>${direct ? `<p class="accent">${time(direct.seconds)} real · ${direct.days.toFixed(1)} fictional days · ${esc(amounts(direct.cost))}</p>` : first ? `<p>Route: ${[s.location, ...path.map((p) => p.to)].map((id) => esc(g.locations.find((l) => l.id === id)!.name)).join(' → ')}</p><p>Full itinerary: ${time(path.reduce((n, leg) => n + leg.seconds, 0))} real · ${esc(amounts(cost))}</p><p>Next leg only: ${time(first.seconds)} real · ${first.days.toFixed(1)} fictional days · ${esc(amounts(first.cost))}. Each leg requires a separate order.</p>` : here ? '' : '<p>Survey connected places to find a path.</p>'}</div><div>${here ? '<span class="badge">YOU ARE HERE</span>' : first ? button(direct ? 'Travel' : `Travel to ${g.locations.find((l) => l.id === first.to)!.name}`, { type: 'travel', target: first.to }, true) : '<button disabled>No known path</button>'}</div></article>`;
        })
        .join('') ||
      '<div class="empty-note">Read the signs at known places to chart this realm.</div>'
    }</div><div style="margin-top:20px">${panel('A way home', `<p>If stranded, request an escort to a refuge. The fee is ${g.rules.recoveryDebt} crowns, repaid through paid work. If everyone is lost, a free militia volunteer can join at a refuge.</p><div class="row-actions">${button('Request escort', { type: 'rescue' })}</div>`)}</div>`;
  }
  function members() {
    return `<div class="section-label">Company / ${living(s).length} OF ${crewCapacity(g, s)} PLACES</div>${panel(
      'Companions',
      living(s)
        .map((member) => {
          const choices = (['primary', 'support', 'rest'] as const).map((assignment) => ({
            assignment,
            error: dispatch(g, s, { type: 'assign', member: member.id, assignment }).error,
          }));
          const locked =
            !controller.isOwner() ||
            !choices.some((c) => c.assignment !== member.assignment && !c.error);
          return `<div class="crew-row"><div class="crew-info"><strong>${esc(member.name)}</strong><small>${esc(member.skill.toUpperCase())}${member.injury ? ' · INJURED' : ''}</small><small class="proficiency">${esc(proficiencyLabel(member))}</small></div><select data-member="${member.id}" aria-label="${esc(member.name)} assignment" ${locked ? 'disabled' : ''}>${choices.map((c) => `<option value="${c.assignment}" ${member.assignment === c.assignment ? 'selected' : ''} ${c.error ? 'disabled' : ''}>${c.assignment === 'primary' ? 'Expedition' : c.assignment === 'support' ? 'Support' : 'Rest'}${c.error && member.assignment !== c.assignment ? ' (unavailable)' : ''}</option>`).join('')}</select></div>`;
        })
        .join('') ||
        '<p>The campfire is empty. Seek an escort to a refuge and recruit a militia volunteer.</p>',
    )}${
      s.crew.some((m) => m.life === 'dead')
        ? panel(
            'In memoriam',
            s.crew
              .filter((m) => m.life === 'dead')
              .map((m) => `<p>${esc(m.name)} · ${esc(m.skill)} · ${esc(proficiencyLabel(m))}</p>`)
              .join(''),
          )
        : ''
    }`;
  }
  function company() {
    const loc = view(g, s).location;
    return `${destinationPanel(g, s)}${followUpWork(g, s, actionCard)}${members()}<p class="proficiency-help">${proficiencyHelp}</p><div class="section-label">${loc.station ? 'Refuge duties' : 'Expedition work'} / ${esc(loc.name)}</div><div class="activity-grid">${g.activities
      .filter(
        (a) =>
          a.slot === 'primary' &&
          !a.mission &&
          (loc.station ? a.at === 'station' : a.at === 'field') &&
          (!a.locations || a.locations.includes(loc.id)),
      )
      .map((a) => actionCard(a.id))
      .join(
        '',
      )}</div>${sitePanel(g, s, (label, command, primary) => button(label, command, primary, false))}<div class="section-label">Support duties</div><div class="activity-grid">${g.activities
      .filter((a) => !a.mission && a.slot === 'support' && (a.at === 'any' || loc.station))
      .map((a) => actionCard(a.id))
      .join(
        '',
      )}</div><div class="section-label">Charters & equipment / INSTALL AT A REFUGE</div><div class="activity-grid">${g.upgrades.map((u) => `<article class="activity-card"><h3>${esc(u.name)}</h3><p>${esc(u.description)}</p><small>${esc(amounts(u.cost))}</small>${s.upgrades.includes(u.id) ? '<span class="badge green">ACQUIRED</span>' : button('Acquire ' + u.name, { type: 'upgrade', id: u.id })}</article>`).join('')}</div>`;
  }
  function refuge() {
    const missionCard = (id: string) => {
      const m = g.missions.find((mission) => mission.id === id)!;
      const state = s.missions.find((x) => x.id === m.id);
      return `<article class="activity-card" data-contract-brief="${esc(m.id)}"><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p>${followUpBrief(g, s, m.id)}<small>${esc(amounts(m.reward))}</small>${state?.claimed ? '<span class="badge green">FULFILLED</span>' : state ? `<span class="mission-status">${state.progress} / ${m.objective.count}</span>${button('Report completed oath', { type: 'claim', id: m.id }, true)}${button('Release oath', { type: 'abandon', id: m.id })}` : button('Accept oath', { type: 'accept', id: m.id }, true)}</article>`;
    };
    return `${destinationPanel(g, s)}${projectOffers(g, s, missionCard)}<div class="faction-grid">${g.factions.map((f) => `<article class="faction-card" style="--faction:${f.color}"><h3>${esc(f.name)}</h3><p>${esc(f.description)}</p><span class="faction-score">${s.reputation[f.id]}</span></article>`).join('')}</div><div class="section-label">The provisioner / ${cargo(g, s)} OF ${s.capacity} PACK SPACE</div>${panel(
      'Provisions',
      g.resources
        .filter((r) => r.id !== 'gold')
        .map(
          (r) =>
            `<div class="trade-row"><div><h3>${esc(r.name)} · ${s.inventory[r.id]}</h3><small>${esc(r.description)}</small><small>Buy ${price(g, s, r.id, 'buy')} crowns / Sell ${price(g, s, r.id, 'sell')} crowns per bundle</small></div><div class="fantasy-trade">${button('Buy 5', { type: 'trade', resource: r.id, amount: 5, direction: 'buy' })}${button('Sell 5', { type: 'trade', resource: r.id, amount: 5, direction: 'sell' })}${button('Sell 1', { type: 'trade', resource: r.id, amount: 1, direction: 'sell' })}</div></div>`,
        )
        .join(''),
    )}<div class="section-label">Company recruitment</div>${discoveryHistory(g, s)}${recruitmentPanel(g, s, button)}<div class="section-label">Oaths & contracts / UP TO THREE ACTIVE</div><div class="activity-grid">${g.missions
      .filter(
        (m) =>
          missionDiscovered(g, s, m) &&
          (!m.discoveryChoice || s.missions.some((saved) => saved.id === m.id)),
      )
      .map((m) => missionCard(m.id))
      .join(
        '',
      )}</div><div style="margin-top:20px">${panel('The chroniclers', `<p>Sell unpublished field chronicles for 90 crowns per place. The buyer gains an exclusive claim: local standing rises and a rival loses standing.</p><div class="row-actions">${button('Sell field chronicles', { type: 'sellData' })}</div>`)}</div>`;
  }
  function update(state: GameState, definition: GameDefinition, force = false) {
    s = state;
    g = definition;
    const v = view(g, s);
    if (
      plannedTarget &&
      !g.locations.some(
        (location) => location.id === plannedTarget && s.known.includes(location.id),
      )
    )
      plannedTarget = null;
    if (lastRegion !== v.region.id) {
      lastRegion = v.region.id;
      region =
        plannedTarget && tab === 'journey'
          ? g.locations.find((location) => location.id === plannedTarget)!.region
          : v.region.id;
    }
    root.querySelector('#breadcrumb')!.textContent = `${v.region.name} · ${v.location.name}`;
    root.querySelector('#save-status')!.textContent = controller.storageStatus();
    const warning = root.querySelector<HTMLElement>('#save-warning')!,
      error = controller.storageError();
    if (warning.querySelector('span')!.textContent !== error)
      warning.querySelector('span')!.textContent = error;
    warning.hidden = !error;
    const next = JSON.stringify([
      s.location,
      s.inventory,
      s.crew,
      s.primary?.id,
      s.support?.id,
      s.nextEvent,
      s.encounter,
      s.threat,
      s.upgrades,
      controller.isOwner(),
    ]);
    if (force || next !== signature) {
      signature = next;
      const focused = (document.activeElement as HTMLElement)?.dataset.key;
      const titles: Record<string, [string, string]> = {
        chronicle: [
          'Beyond the last lantern.',
          'A company of the living, in a country that forgets the difference.',
        ],
        journey: [
          'The road remembers.',
          'Chart the forest, cross the old paths, and descend beneath the roots.',
        ],
        company: [
          'Count those who return.',
          'Choose who leads, who studies, and who keeps the others alive.',
        ],
        refuge: [
          'A light in the window.',
          'Buy provisions, recruit companions, and take another oath.',
        ],
      };
      main.classList.toggle('work-focused', tab !== 'chronicle');
      main.innerHTML = `${!controller.isOwner() ? '<div class="banner">This company is active in another tab. Close it and reload here to take command.</div>' : ''}<div class="page-heading"><div><div class="eyebrow">HOLLOWMERE / ${tab.toUpperCase()}</div><h1>${titles[tab][0]}</h1><p>${titles[tab][1]}</p></div><span class="badge">YEAR ${v.year}</span></div><div class="resource-strip">${[
        'gold',
        'rations',
        'incense',
        'bolts',
        'wood',
      ]
        .map((id) => {
          const r = g.resources.find((r) => r.id === id)!;
          return `<div class="resource"><small>${r.name}</small><strong>${s.inventory[id]}<span>${r.unit}</span></strong></div>`;
        })
        .join(
          '',
        )}</div>${encounter()}${threatPanel(g, s, button, 'Burn the cursed stores')}${discoveryPanel(g, s, (label, command, primary) => button(label, command, primary, false), tab === 'refuge' ? undefined : '<button data-tab="refuge">Review discovery</button>')}${jobs()}${planningSummary(g, s)}${tab === 'chronicle' ? chronicle() : tab === 'journey' ? journey() : tab === 'company' ? company() : refuge()}<footer class="footer"><span>HOLLOWMERE / COMPANY CHRONICLE<br>THE FOREST KEEPS ITS OWN ACCOUNTS.</span><span>SEED ${s.seed} · v0.13<br><a href="../?games=1">All games</a></span></footer>`;
      for (const el of root.querySelectorAll<HTMLElement>('[data-tab]'))
        el.setAttribute('aria-current', el.dataset.tab === tab ? 'page' : 'false');
      const canvas = main.querySelector<HTMLCanvasElement>('#fantasy-scene');
      if (canvas) drawFantasyScene(canvas, v.location);
      if (focused)
        [...main.querySelectorAll<HTMLElement>('[data-key]')]
          .find((el) => el.dataset.key === focused)
          ?.focus({ preventScroll: true });
    }
    for (const slot of ['primary', 'support'] as const) {
      const job = s[slot];
      if (job) {
        main
          .querySelectorAll(`[data-timer=${slot}]`)
          .forEach(
            (el) =>
              (el.textContent = s.encounter || threatAlert(s) ? 'HOLDING' : time(job.remaining)),
          );
        main
          .querySelectorAll<HTMLElement>(`[data-progress=${slot}]`)
          .forEach((el) => (el.style.width = `${100 * (1 - job.remaining / job.total)}%`));
      }
    }
  }
  function ask(text: string, action: () => void) {
    returnFocus = document.activeElement as HTMLElement;
    confirmAction = action;
    root.querySelector('#confirm-description')!.textContent = text;
    confirm.showModal();
    confirm.querySelector<HTMLButtonElement>('[data-action=cancel]')!.focus();
  }
  root.addEventListener('click', async (event) => {
    const target = (event.target as Element).closest<HTMLElement>('button');
    if (!target) return;
    if (target.dataset.contractReview) {
      const id = target.dataset.contractReview;
      tab = target.dataset.contractView === 'board' ? 'refuge' : 'company';
      update(s, g, true);
      focusContractBrief(main, id);
      return;
    }
    if (target.dataset.routeTarget) {
      const destination = g.locations.find(
        (location) => location.id === target.dataset.routeTarget && s.known.includes(location.id),
      );
      if (!destination) return;
      plannedTarget = destination.id;
      region = destination.region;
      tab = 'journey';
      update(s, g, true);
      main.querySelector<HTMLElement>('#route-plan-title')?.focus();
      main.querySelector('#route-plan-title')?.scrollIntoView({ block: 'start' });
      return;
    }
    if (target.dataset.planningView) {
      const view = target.dataset.planningView;
      tab = view === 'board' || view === 'supplies' ? 'refuge' : 'company';
      update(s, g, true);
      const focus =
        view === 'crew'
          ? main.querySelector<HTMLElement>('.crew-row')
          : view === 'supplies'
            ? main.querySelector<HTMLElement>('.trade-row')
            : main;
      focus?.setAttribute('tabindex', '-1');
      focus?.focus();
      focus?.scrollIntoView({ block: 'start' });
      return;
    }
    if (target.dataset.tab) {
      tab = target.dataset.tab;
      update(s, g, true);
      if (innerWidth <= 640) scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (target.dataset.region) {
      plannedTarget = null;
      region = target.dataset.region;
      update(s, g, true);
      return;
    }
    if (target.dataset.command) {
      const command = JSON.parse(target.dataset.command) as Command;
      if (command.type === 'cancelWorkWatch') {
        ask(
          'End this extended work order early? You forfeit all its pay, debt repayment and practice. Support work stays committed.',
          () => controller.command(command),
        );
        return;
      }
      if (
        command.type === 'activity' &&
        g.activities.find((a) => a.id === command.id)?.effect === 'expose'
      ) {
        ask(
          'Opening this reliquary can bring a hidden curse into the company. Explicit responses to the revealed curse can permanently kill companions. It will never kill anyone while you are away. Continue?',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'discovery') {
        const def = g.discoveryEvents?.entries.find((entry) => entry.id === command.id);
        const choice =
          def?.kind === 'choice'
            ? def.choices.find((choice) => choice.id === command.choice)
            : undefined;
        ask(
          `${choice?.name ?? 'Settle discovery'}? ${choice?.description ?? ''} This decision is final for this company.`,
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'threat' && command.action === 'purge') {
        ask(
          'Burn the affected stores? The curse is removed with no casualties, but 20% of physical supplies are destroyed.',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'rescue') {
        ask('Request an escort? It costs 100 crowns of debt, repaid through refuge work.', () =>
          controller.command(command),
        );
        return;
      }
      if (command.type === 'abandon' || command.type === 'sellData') {
        ask(
          command.type === 'abandon'
            ? 'Release this oath? Its progress will be cleared.'
            : 'Sell all unpublished chronicles exclusively to the local faction? Rival standing will fall.',
          () => controller.command(command),
        );
        return;
      }
      controller.command(command);
      return;
    }
    const action = target.dataset.action,
      error = root.querySelector('#settings-error')!;
    try {
      if (action === 'settings') {
        returnFocus = target;
        root.querySelector<HTMLInputElement>('#sound')!.checked = controller.preferences.sound;
        root.querySelector<HTMLInputElement>('#motion')!.checked = controller.preferences.motion;
        settings.showModal();
      }
      if (action === 'close') {
        settings.close();
        returnFocus?.focus();
      }
      if (action === 'export')
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = controller.exportSave();
      if (action === 'backup')
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = controller.backupSave();
      if (action === 'download') {
        const url = URL.createObjectURL(
          new Blob([controller.exportSave()], { type: 'application/json' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `hollowmere-${s.seed}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      if (action === 'import') {
        const text = root.querySelector<HTMLTextAreaElement>('#save-text')!.value;
        ask('Replace the current company with this save? A backup will be kept.', () => {
          try {
            controller.importSave(text);
            settings.close();
            notify('Company imported.');
          } catch (e) {
            error.textContent = (e as Error).message;
          }
        });
      }
      if (action === 'reset') {
        const seed = Number(root.querySelector<HTMLInputElement>('#new-seed')!.value);
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295)
          throw Error('Use a whole seed between 0 and 4294967295.');
        ask('Start a new company? The current company will be backed up.', () => {
          try {
            controller.reset(seed);
            settings.close();
            notify('A new company has gathered.');
          } catch (e) {
            error.textContent = (e as Error).message;
          }
        });
      }
      if (action === 'cancel') {
        confirm.close();
        confirmAction = null;
        returnFocus?.focus();
      }
      if (action === 'confirm') {
        const fn = confirmAction;
        confirmAction = null;
        confirm.close();
        fn?.();
      }
    } catch (e) {
      error.textContent = (e as Error).message;
    }
  });
  confirm.addEventListener('cancel', () => (confirmAction = null));
  root.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.member)
      controller.command({
        type: 'assign',
        member: target.dataset.member,
        assignment: target.value as 'primary' | 'support' | 'rest',
      });
    if (target.id === 'sound') controller.setSound(target.checked);
    if (target.id === 'motion') controller.setMotion(target.checked);
  });
  return { update, notify };
}
