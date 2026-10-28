import { planningSummary, projectOffers, routePlanPanel } from './planning-panels';
import { proficiencyLabel, proficiencyHelp } from './proficiency';
import { chartLines } from './world-map';
import { missionDiscovered } from '../engine/missions';
import { followUpBrief, followUpWork, boundWorkCard } from './mission-panels';
import { activityPreview, sitePanel } from './site-panels';
import { threatAlert } from '../engine/threats';
import { living, crewCapacity } from '../engine/personnel';
import {
  recruitmentPanel,
  threatPanel,
  discoveryPanel,
  discoveryHistory,
} from './expedition-panels';
import type { Amounts, Command, GameDefinition, GameState, Job } from '../engine/types';
import { planRoute } from '../engine/navigation';
import { activityDuration, cargo, dispatch, price, routesFrom, view } from '../engine/simulation';
import { describeEvent, guidance } from '../game/text';
import { drawPortrait, drawScene } from './art';
import type { AppController } from '../browser/controller';

const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function duration(seconds: number) {
  const n = Math.ceil(seconds);
  return n >= 3600
    ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`
    : n >= 60
      ? `${Math.floor(n / 60)}m ${n % 60}s`
      : `${n}s`;
}
const icons: Record<string, string> = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  navigation: 'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M8 16l3-7 5-1-3 7z',
  operations: 'M9 3h6v4l3 2 3-1v7l-3-1-3 3v4H9v-4l-3-3-3 1V8l3 1 3-2z M9 12h6',
  contacts: 'M4 21v-4l4-3 M20 21v-4l-4-3 M8 6a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M9 21v-5h6v5',
  settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  arrow: 'M4 12h15 M13 6l6 6-6 6',
  logo: 'M3 4h18L5 20V4 M5 12h9 M13 20l8-8v8z',
  signal: 'M4 20v-4 M9 20V12 M14 20V8 M19 20V3',
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] ?? icons.arrow}"/></svg>`;
const panel = (title: string, body: string, tag = '') =>
  `<section class="panel"><div class="panel-head"><h2>${title}</h2><span class="eyebrow">${tag}</span></div><div class="panel-body">${body}</div></section>`;
export function mountApp(root: HTMLElement, controller: AppController) {
  let g: GameDefinition,
    s: GameState,
    tab = 'overview',
    selectedRegion = 'vesper',
    plannedTarget: string | null = null,
    signature = '',
    observedRegion = '',
    noticeTimer: ReturnType<typeof setTimeout>,
    confirmAction: (() => void) | null = null,
    returnFocus: HTMLElement | null = null;
  root.innerHTML = `<a class="skip-link" href="#main-content">Skip to ship console</a><div class="app-shell"><aside class="sidebar"><div class="wordmark">${icon('logo')}<div class="brand">FAR<br>WAKE<small>FRONTIER SURVEY</small></div></div><div class="charter">EXPLORATION CHARTER / 017</div><nav class="navigation" aria-label="Ship console">${['overview', 'navigation', 'operations', 'contacts'].map((t, i) => `<button class="nav-button" data-tab="${t}" aria-current="${i === 0 ? 'page' : 'false'}">${icon(t)}<span>${t[0].toUpperCase() + t.slice(1)}</span><span class="nav-number">0${i + 1}</span></button>`).join('')}</nav><div class="sidebar-bottom"><div class="eyebrow">A LITTLE FURTHER OUT.</div><p style="font-size:10px;margin-top:8px">The frontier is patient.<br>Your creditors aren't.</p><div class="ship-id"><div class="flex">${icon('signal')}<strong>SV KESTREL</strong></div><small>LIGHT SURVEY VESSEL<br>CHARTERED SURVEY · CLASS III</small></div><button class="quiet" data-action="settings" style="width:100%;margin-top:20px">Ship settings</button></div></aside><div class="main-wrap"><header class="topbar"><div class="mobile-brand">FAR WAKE<span class="accent"> /</span></div><div class="topbar-location"><div class="eyebrow">CHARTER / DEEP FIELD OPERATIONS</div><small id="breadcrumb">ESTABLISHING CHART</small></div><div class="topbar-right"><a class="library-link" href="../?games=1">All games</a><span class="eyebrow storage-label" id="save-status"><span class="save-dot"></span>LOCAL SAVE</span><span class="badge" id="year-badge">SHIP YEAR 2186</span><button class="quiet flex" data-action="settings" aria-label="Settings">${icon('settings')}</button></div></header><div id="save-warning" class="save-warning" role="alert" hidden><span></span><button data-action="settings">Save settings</button></div><main class="page" id="main-content" tabindex="-1"></main></div></div><div class="notice" role="status" aria-live="polite"></div><dialog id="settings-dialog" aria-labelledby="settings-title"><div class="flex between"><h2 id="settings-title">Ship settings</h2><button data-action="close-settings" aria-label="Close settings">×</button></div><p>Your expedition lives on this device. Export a save to keep a backup or move between browsers.</p><label><input id="sound-setting" type="checkbox"> Enable quiet ship sounds</label><label><input id="motion-setting" type="checkbox"> Reduce motion</label><div class="line"></div><h3>Save & transfer</h3><div class="settings-actions"><button data-action="export">Export to text</button><button data-action="download">Download save</button><button data-action="copy">Copy save</button><button data-action="backup">Load local backup</button></div><textarea id="save-text" aria-label="Save JSON" placeholder="Export a save, or paste one here to import."></textarea><div class="settings-actions"><button data-action="import">Import pasted save</button><label style="margin:0"><span class="eyebrow">Or choose a save file</span><input id="save-file" type="file" accept=".json,application/json" style="display:block;width:100%"></label></div><p id="settings-error" class="dialog-error" role="status"></p><div class="line"></div><h3>How time works</h3><p>Jobs run while you are away, up to 24 hours. Arrivals and encounters stop safely. There is no automatic chain of expeditions. Cryosleep compresses fictional years into real minutes.</p><p>At stations, work shifts earn credits without supplies. If stranded elsewhere, request a recovery tow. Crew and ship survive, with a debt repaid through station work.</p><p id="save-details"></p><div class="line"></div><p>New expeditions generate crew, faction and place names from the seed. Use a different seed for different names. Your current names stay with this save.</p><label for="new-seed">New expedition seed</label><input id="new-seed" type="number" min="0" max="4294967295" step="1" value="1701"><div class="settings-actions"><button class="danger quiet" data-action="reset">Start a new expedition</button></div><p><a href="../hollowmere/">Play Hollowmere — a dark fantasy expedition</a></p><small>Original code and pixel artwork. No accounts, trackers, or server required. Version 0.12 · FAR WAKE</small></dialog><dialog id="confirm-dialog" aria-labelledby="confirm-title"><h2 id="confirm-title">Confirm order</h2><p id="confirm-description"></p><div class="row-actions"><button data-action="confirm" class="primary">Confirm order</button><button data-action="cancel">Keep current orders</button></div></dialog>`;
  const main = root.querySelector<HTMLElement>('main')!,
    settings = root.querySelector<HTMLDialogElement>('#settings-dialog')!,
    confirmDialog = root.querySelector<HTMLDialogElement>('#confirm-dialog')!;
  const notify = (message: string) => {
    root.querySelector('.notice')!.textContent = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (root.querySelector('.notice')!.textContent = ''), 6500);
  };
  const amountText = (a: Amounts) =>
    Object.entries(a)
      .map(([id, n]) => `${n} ${g.resources.find((r) => r.id === id)?.name.toLowerCase() ?? id}`)
      .join(' · ') || 'No supplies required';
  function button(label: string, c: Command, primary = false, explanationId?: string) {
    const error = dispatch(g, s, c).error,
      disabled = error || !controller.isOwner();
    return `<button ${disabled ? 'disabled' : ''} data-command="${esc(JSON.stringify(c))}" data-key="${esc(JSON.stringify(c))}" class="${primary ? 'primary' : ''}" ${error ? `title="${esc(error)}"${explanationId ? ` aria-describedby="${explanationId}"` : ''}` : ''}>${esc(label)}</button>`;
  }
  function metric(label: string, value: number, max = 100, inverse = false) {
    return `<div class="metric"><div class="metric-label"><span>${label}</span><span>${Math.round(value)}${max === 100 ? '%' : ` / ${max}`}</span></div><div class="meter ${(inverse ? value > 65 : value < 30) ? 'red' : inverse ? 'amber' : ''}" role="meter" aria-label="${label}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}"><span style="width:${Math.min(100, (value / max) * 100)}%"></span></div></div>`;
  }
  function jobName(j: Job) {
    return j.kind === 'rescue'
      ? 'Recovery tow'
      : j.kind === 'travel'
        ? `En route to ${g.locations.find((l) => l.id === j.target)!.name}`
        : g.activities.find((a) => a.id === j.definition)!.name +
          (j.site ? ` · ${g.sites?.find((site) => site.id === j.site)?.name ?? j.site}` : '');
  }
  function jobs() {
    return (['primary', 'support'] as const)
      .map((slot) => {
        const j = s[slot];
        if (!j) return '';
        return `<section class="active-job"><div class="flex between"><div><div class="eyebrow">${slot === 'primary' ? 'Flight & expedition' : 'Engineering support'} ${s.encounter || threatAlert(s) ? '· HOLDING' : ''}</div><h3 style="margin-top:7px">${esc(jobName(j))}</h3></div><span class="job-time" data-timer="${slot}">${duration(j.remaining)}</span></div><div class="meter amber"><span data-progress="${slot}" style="width:${(1 - j.remaining / j.total) * 100}%"></span></div><small>${j.kind === 'travel' && j.days >= 365 ? `CRYOSLEEP ACTIVE · ${Math.round((j.days / 365.25) * 10) / 10} fictional years · Arrival ${g.rules.startingYear + Math.floor((s.calendarDays + j.days) / 365.25)}` : 'Progress is saved when you leave. No need to keep this screen open.'}</small></section>`;
      })
      .join('');
  }
  function encounter() {
    if (!s.encounter) return '';
    const options: [string, Command & { type: 'encounter' }, string][] = [
      [
        'Fire weapons',
        { type: 'encounter', choice: 'fight' },
        '2 ammunition · roughly 60–80% success with security crew',
      ],
      [
        'Evade contact',
        { type: 'encounter', choice: 'evade' },
        '2 propellant · 25% chance of hull damage',
      ],
      [
        'Negotiate passage',
        { type: 'encounter', choice: 'bargain' },
        '40 credits · safe passage; improves pirate standing',
      ],
      [
        'Surrender cargo',
        { type: 'encounter', choice: 'surrender' },
        'Lose 20% of physical cargo · ship and crew remain safe',
      ],
    ];
    return `<section class="encounter"><div class="eyebrow accent">UNREGISTERED CONTACT / OPERATIONS PAUSED</div><h2>You're not alone out here.</h2><p>A vessel without a registered transponder is matching your velocity. Your crew waits for orders. ${s.encounter.round ? 'Incoming fire has damaged the hull.' : ''}</p><div class="encounter-actions">${options.map(([name, c, note]) => `<div>${button(name, c, c.choice === 'fight')}<small style="display:block;margin:6px 0">${note}</small></div>`).join('')}</div></section>`;
  }
  function crewControls() {
    return living(s)
      .map((member, index) => {
        const choices = (
          [
            ['primary', 'Expedition'],
            ['support', 'Support'],
            ['rest', 'Rest'],
          ] as const
        ).map(([assignment, label]) => ({
          assignment,
          label,
          error: dispatch(g, s, { type: 'assign', member: member.id, assignment }).error,
        }));
        const locked =
          !controller.isOwner() ||
          !choices.some((choice) => choice.assignment !== member.assignment && !choice.error);
        return `<div class="crew-row"><canvas class="portrait" data-portrait="${index}" role="img" aria-label="Pixel portrait of ${esc(member.name)}"></canvas><div class="crew-info"><strong>${esc(member.name)}</strong><small>${esc(member.skill.toUpperCase())} ${member.injury ? '· INJURED' : ''}</small><small class="proficiency">${esc(proficiencyLabel(member))}</small></div><select aria-label="${esc(member.name)} assignment" data-member="${member.id}" ${locked ? 'disabled' : ''}>${choices.map((choice) => `<option value="${choice.assignment}" ${choice.assignment === member.assignment ? 'selected' : ''} ${choice.error ? 'disabled' : ''}>${choice.label}${choice.error && choice.assignment !== member.assignment ? ' (unavailable)' : ''}</option>`).join('')}</select>${locked && controller.isOwner() ? `<small>${esc(choices.find((choice) => choice.error)?.error ?? 'Assignments are unavailable.')}</small>` : ''}</div>`;
      })
      .join('');
  }
  function crewCompact() {
    return living(s)
      .map(
        (c, i) =>
          `<div class="crew-row"><canvas class="portrait" data-portrait="${i}" role="img" aria-label="${esc(c.name)}"></canvas><div class="crew-info"><strong>${esc(c.name)}</strong><small>${esc(c.skill.toUpperCase())}</small></div><span class="${c.injury ? 'danger' : 'green'}" style="font-size:9px">${c.injury ? 'INJURED' : c.assignment === 'rest' ? 'RESTING' : 'READY'}</span></div>`,
      )
      .join('');
  }
  function log(limit = 5) {
    return [...s.events]
      .reverse()
      .slice(0, limit)
      .map(
        (e) =>
          `<div class="log-row"><time>T+${Math.floor(e.at / 60)
            .toString()
            .padStart(3, '0')}</time><span>${esc(describeEvent(g, e))}</span></div>`,
      )
      .join('');
  }
  function directive() {
    const guide = guidance(g, s);
    return `<section class="directive" aria-label="Current directive"><div><h2>${esc(guide.title)}</h2><p>${esc(guide.text)}</p></div><div class="directive-action">${!s.missions.some((m) => m.id === 'first-light') && !s.primary && !s.encounter && !threatAlert(s) ? button('Accept First light', { type: 'accept', id: 'first-light' }, true) : `<button class="primary" data-tab="${guide.tab}">Open ${guide.tab}</button>`}</div></section>`;
  }
  function overview() {
    const v = view(g, s),
      d = s.discoveries[s.location],
      travel = s.primary?.kind === 'travel';
    return `${directive()}<div class="dashboard"><div><section class="panel"><div class="panel-head"><h2 class="flex"><span class="dot ${travel ? 'blink' : ''}"></span>${travel ? 'Transit observation' : 'External observation'}</h2><span class="eyebrow">CAM 01 / LIVE</span></div><div class="scene-wrap"><canvas class="scene" id="scene" role="img" aria-label="Pixel art of the survey ship Kestrel ${travel ? 'in transit' : `at ${esc(v.location.name)}`}"></canvas><div class="scene-label">${travel ? 'CRYOSLEEP / TRANSIT' : v.location.station ? 'DOCKED / BERTH 07' : 'HOLDING ORBIT'}<span class="dot"></span></div><span class="scene-cross" aria-hidden="true">⌖</span></div><div class="scene-caption"><div class="flex between"><div class="location-title">${esc(v.location.name)}</div><span class="badge">${esc(v.location.kind)}</span></div><p>${esc(v.location.description)}</p><div class="row-actions"><button class="primary flex" data-tab="${v.location.station ? 'navigation' : 'operations'}">${v.location.station ? 'Plot a course' : 'Survey & explore'} ${icon('arrow')}</button><button class="quiet" data-tab="${v.location.station ? 'contacts' : 'navigation'}">${v.location.station ? 'Station services' : 'Navigation chart'}</button></div></div><div class="panel-footer">${esc(v.region.name.toUpperCase())} SYSTEM / ${d?.surveyed ? 'SURVEY RECORD AVAILABLE' : 'SURVEY PENDING'} / ${v.location.station ? 'PRESSURIZED DOCK' : 'ENVIRONMENTAL SEAL REQUIRED'}</div></section><div class="overview-lower">${panel('Frontier record', `<div class="status-lines"><div><span>Navigation contacts</span><b>${s.known.length} / ${g.locations.length}</b></div><div><span>Bodies surveyed</span><b>${Object.entries(s.discoveries).filter(([id, d]) => d.surveyed && !g.locations.find((l) => l.id === id)!.station).length} / ${g.locations.filter((l) => !l.station).length}</b></div><div><span>Sites investigated</span><b>${Object.values(s.discoveries).reduce((n, d) => n + d.sites.length, 0)}</b></div><div><span>Contracts filed</span><b>${v.completedMissions} / ${g.missions.length}</b></div><div><span>Ship calendar elapsed</span><b>${Math.round(s.calendarDays)} days</b></div></div>`, 'EXPEDITION 01')}</div><div style="margin-top:20px">${panel("Captain's log", log(6), 'MOST RECENT FIRST')}</div></div><div class="stack">${panel('Vessel condition', `${metric('Hull integrity', s.integrity)}${metric('Machinery wear', s.wear, 100, true)}${metric('Cargo hold', cargo(g, s), s.capacity)}<div class="line"></div><div class="status-lines"><div><span>Power & life support</span><b class="green">NOMINAL</b></div><div><span>Cryo systems</span><b>${travel ? 'ENGAGED' : 'STANDBY'}</b></div><div><span>Recovery debt</span><b>${s.debt} cr</b></div></div><button class="quiet" data-tab="operations" style="width:100%;margin-top:18px">Manage vessel</button>`, 'KESTREL')}${panel('Crew manifest', crewCompact(), `${living(s).length} / ${crewCapacity(g, s)} BERTHS`)}${panel('A note from the office', `<p style="font-size:11px">“The unknown is simply an asset that has not yet been entered into the ledger.”</p><small style="display:block;margin-top:14px">${esc(g.factions.find((f) => f.id === 'combine')!.name.toUpperCase())}<br>FRONTIER OPERATIONS HANDBOOK §1.1</small>`, 'INTERNAL')}</div></div>`;
  }
  function navigation() {
    const v = view(g, s),
      region = g.regions.find((r) => r.id === selectedRegion) ?? v.region,
      knownRegions = new Set(
        g.locations.filter((l) => s.known.includes(l.id)).map((l) => l.region),
      );
    const map = `<div class="map">${chartLines(g)}${g.regions.map((r) => `<button class="star-button ${r.id === v.region.id ? 'current' : ''} ${r.id === selectedRegion ? 'selected' : ''} ${knownRegions.has(r.id) ? '' : 'unknown'}" style="left:${r.x}%;top:${r.y}%;--star:${r.color}" data-region="${r.id}" aria-label="${knownRegions.has(r.id) ? r.name : 'Unresolved system'} system"><span class="star" aria-hidden="true">✦</span><small>${knownRegions.has(r.id) ? esc(r.name) : 'UNRESOLVED'}</small></button>`).join('')}</div>`;
    const locations = g.locations.filter((l) => l.region === region.id && s.known.includes(l.id));
    const bodyList = locations.length
      ? locations
          .map((l) => {
            const here = l.id === s.location,
              route = routesFrom(g, s).find((r) => r.target === l.id),
              itinerary = !here && !route ? planRoute(g, s, l.id) : [],
              nextLeg = itinerary[0],
              nextLocation = nextLeg
                ? g.locations.find((location) => location.id === nextLeg.to)!
                : null,
              d = s.discoveries[l.id];
            const itineraryText = itinerary.length
              ? [s.location, ...itinerary.map((leg) => leg.to)]
                  .map((id) => g.locations.find((location) => location.id === id)!.name)
                  .join(' → ')
              : '';
            const totalCost: Amounts = {};
            for (const leg of itinerary)
              for (const [resource, amount] of Object.entries(leg.cost))
                totalCost[resource] = (totalCost[resource] ?? 0) + amount;
            const routeDetails = route
              ? `<div class="eyebrow accent">${duration(route.seconds)} REAL · ${route.days >= 365 ? `${Math.round((route.days / 365.25) * 10) / 10} YEARS / CRYOSLEEP` : `${route.days} DAYS SHIP TIME`}</div><p>${esc(amountText(route.cost))} · ${Math.round(route.risk * 100)}% incident risk</p>`
              : nextLeg && nextLocation
                ? `<p class="accent">${esc(itineraryText)}</p><p>First travel to ${esc(nextLocation.name)}. Then issue the next course order toward ${esc(l.name)}.</p><p>Full itinerary: ${duration(itinerary.reduce((seconds, leg) => seconds + leg.seconds, 0))} real · ${esc(amountText(totalCost))}</p><p>Next leg only: ${duration(nextLeg.seconds)} real · ${esc(amountText(nextLeg.cost))}. Each leg requires a separate order.</p>`
                : !here
                  ? '<p>No charted route reaches this destination. Survey connected locations to resolve more navigation contacts.</p>'
                  : '';
            const action = here
              ? '<span class="badge" style="align-self:center">YOU ARE HERE</span>'
              : route
                ? button('Set course', { type: 'travel', target: l.id }, true)
                : nextLeg && nextLocation
                  ? button(
                      `Travel to ${nextLocation.name}`,
                      { type: 'travel', target: nextLeg.to },
                      true,
                    )
                  : '<button disabled>No charted route</button>';
            return `<article class="route-card ${here ? 'current' : ''}"><div><div class="flex"><span class="body-disc" style="--body:${l.color}" aria-hidden="true"></span><div><h3>${esc(l.name)} ${here ? '<span class="accent">/ CURRENT</span>' : ''}</h3><small>${esc(l.kind)} · ${d?.surveyed ? 'Surveyed' : 'Unsurveyed'}</small></div></div><p>${esc(l.description)}</p>${routeDetails}</div>${action}</article>`;
          })
          .join('')
      : '<div class="empty-note">This system is an unresolved signal. Survey worlds along the frontier to establish a route.</div>';
    return `${plannedTarget ? routePlanPanel(g, s, plannedTarget, button) : ''}<div class="dashboard"><div class="stack"><section class="panel"><div class="panel-head"><h2>Frontier navigation chart</h2><span class="eyebrow">${g.regions.length} SYSTEMS / LOCAL ARRAY</span></div>${map}<div class="panel-footer">SELECT A SYSTEM · DASHED LINES INDICATE POTENTIAL INTERSTELLAR CORRIDORS</div></section><section class="panel"><div class="panel-head"><h2>${esc(region.name)} system</h2><span class="eyebrow">${locations.length} CONTACTS</span></div><div class="panel-body"><div class="system-summary"><p>${esc(region.subtitle)}</p><small>All times are real unless marked ship time.</small></div><div class="route-list">${bodyList}</div></div></section></div><div class="stack">${panel('Flight planning', `<p>Survey a body to resolve the rest of its system and any outbound signals. Arrival at a new station resolves nearby bodies.</p><div class="line"></div><p>Once a neighboring system is charted, you can depart from any world or station in your current system. Local departure and arrival transfers are included in the interstellar estimate. More distant systems may require a stop in an intermediate system.</p><div class="line"></div><p>Interstellar crossings spend years in cryosleep. Your crew stays safe while you are away. Route costs include departure and arrival burns.</p><div class="line"></div><p>Support jobs may run in transit. Finish existing support work before departure.</p>`, 'READ BEFORE DEPARTURE')}${panel('Recovery service', `<p>Stranded? A tug can bring the Kestrel to the nearest station with at least 40% hull integrity. The 150 credit fee becomes debt, repaid through work shifts.</p><div class="row-actions">${button('Request recovery tow', { type: 'rescue' })}</div>`, 'NO CREW LEFT BEHIND')}</div></div>`;
  }
  function activityCard(id: string) {
    const a = g.activities.find((a) => a.id === id)!,
      command: Command = { type: 'activity', id },
      error = dispatch(g, s, command).error,
      preview = activityPreview(g, s, id);
    if (a.mission) return boundWorkCard(g, s, id, button, 'Start support job');
    return `<article class="activity-card"><div class="flex between"><h3>${esc(a.name)}</h3><span class="badge">${duration(activityDuration(g, s, id))}</span></div><p>${esc(a.description)}</p><div class="cost">${esc(amountText(preview.cost))}</div>${preview.note ? `<small>${esc(preview.note)}</small>` : ''}${a.id === 'gather' ? `<small>Deposit return: ${esc(amountText(view(g, s).location.yields))}, plus crew bonuses.</small>` : Object.keys(preview.reward).length ? `<small>Return: ${esc(amountText(preview.reward))}</small>` : ''}${button(a.slot === 'support' ? 'Start support job' : 'Begin activity', command, !error)}${error ? `<div class="reason">${esc(error)}</div>` : ''}</article>`;
  }
  function operations() {
    const loc = view(g, s).location,
      d = s.discoveries[loc.id];
    return `${followUpWork(g, s, activityCard)}<div class="dashboard"><div><div class="section-label">${loc.station ? 'Dockside operations' : 'Survey & field operations'}</div><div class="activity-grid">${(loc.station ? ['work', 'aid'] : ['survey', 'explore', 'gather', 'raid', ...g.activities.filter((a) => a.effect === 'expose' && a.locations?.includes(loc.id)).map((a) => a.id)]).map(activityCard).join('')}</div>${g.sites ? sitePanel(g, s, button) : !loc.station ? `<div class="section-label">Site registry / ${d?.sites.length ?? 0} OF ${loc.sites.length} INVESTIGATED</div>${panel('Surface contacts', loc.sites.map((site, i) => `<div class="log-row"><span class="${d?.sites.includes(site) ? 'green' : 'muted'}">${d?.sites.includes(site) ? '✓' : '◇'} ${String(i + 1).padStart(2, '0')}</span><span>${d?.surveyed ? esc(site) : 'Awaiting orbital survey'} ${d?.sites.includes(site) ? '· RECORD SECURED' : ''}</span></div>`).join(''))}` : ''}<div class="section-label">Engineering / independent support team</div><div class="activity-grid">${['repair', 'service', 'refine', 'fabricate', 'arm', 'triage', ...(loc.station ? ['heal'] : [])].map(activityCard).join('')}</div></div><div class="stack">${panel(
      'Crew assignments',
      `${crewControls()}${
        s.crew.some((m) => m.life === 'dead')
          ? `<div class="line"></div><h3>In memoriam</h3><p>${s.crew
              .filter((m) => m.life === 'dead')
              .map((m) => `${esc(m.name)} · ${esc(proficiencyLabel(m))}`)
              .join('<br>')}</p>`
          : ''
      }<p style="font-size:10px;margin-top:15px">${proficiencyHelp} Expedition security improves combat odds. Injuries reduce bonuses; treatment is available at stations. Assignments lock while a team is working.</p>`,
      'PRIMARY / SUPPORT',
    )}${panel('Vessel condition', `${metric('Hull integrity', s.integrity)}${metric('Machinery wear', s.wear, 100, true)}${metric('Cargo hold', cargo(g, s), s.capacity)}<p>Wear increases with travel and makes arrival damage worse. Restore the hull and service equipment before committing to a long crossing.</p>`)}${panel('Equipment upgrades', g.upgrades.map((u) => `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><h3>${esc(u.name)}</h3><p style="font-size:10px;margin:7px 0">${esc(u.description)}</p><small>${esc(amountText(u.cost))}</small><div class="row-actions">${s.upgrades.includes(u.id) ? '<span class="badge green">INSTALLED</span>' : button('Install upgrade', { type: 'upgrade', id: u.id })}</div></div>`).join(''), 'STATION INSTALLATION')}</div></div>`;
  }
  function contacts() {
    const loc = view(g, s).location,
      active = s.missions.filter((m) => !m.claimed),
      offered = g.missions.filter(
        (m) =>
          !m.discoveryChoice &&
          !s.missions.some((x) => x.id === m.id) &&
          missionDiscovered(g, s, m),
      );
    const missionCard = (id: string) => {
      const m = g.missions.find((m) => m.id === id)!,
        state = s.missions.find((x) => x.id === id),
        ready = state && state.progress >= m.objective.count,
        acceptError = state ? undefined : dispatch(g, s, { type: 'accept', id: m.id }).error;
      return `<article class="activity-card"><div class="flex between"><h3>${esc(m.name)}</h3><span class="eyebrow">${esc(g.factions.find((f) => f.id === m.faction)!.name)}</span></div><p>${esc(m.description)}</p>${followUpBrief(g, s, m.id)}<div class="cost">${esc(amountText(m.reward))} · +${m.reputation} standing</div>${state ? `<div class="mission-status">${ready ? 'OBJECTIVES COMPLETE — FILE AT ANY STATION' : `${state.progress} / ${m.objective.count} OBJECTIVES COMPLETE`}</div>${button('File contract', { type: 'claim', id: m.id }, !!ready)}${button('Release contract', { type: 'abandon', id: m.id })}` : button('Accept contract', { type: 'accept', id: m.id }, m.id === 'first-light')}${state && m.sourceSite && dispatch(g, s, { type: 'abandon', id: m.id }).error ? `<small>${esc(dispatch(g, s, { type: 'abandon', id: m.id }).error)}</small>` : ''}${acceptError ? `<small class="reason">${esc(acceptError)}</small>` : ''}${!state && m.requires && !s.missions.some((x) => x.id === m.requires && x.claimed) ? `<small>Requires: ${esc(g.missions.find((x) => x.id === m.requires)!.name)}</small>` : ''}</article>`;
    };
    return `${projectOffers(g, s, missionCard)}<div class="section-label">Faction relations</div><div class="faction-grid">${g.factions.map((f) => `<article class="faction-card" style="--faction:${f.color}"><h3>${esc(f.name)}</h3><p>${esc(f.description)}</p><div class="flex between"><span class="faction-score">${s.reputation[f.id] > 0 ? '+' : ''}${s.reputation[f.id]}</span><span class="eyebrow">${s.reputation[f.id] > 15 ? 'FAVORED' : s.reputation[f.id] < -15 ? 'DISTRUSTED' : 'NEUTRAL'}</span></div></article>`).join('')}</div><div class="section-label">Station exchange / ${loc.station ? esc(loc.name) : 'DOCKING REQUIRED'}</div><div class="dashboard"><div class="stack">${panel(
      'Provisions & resupply',
      `<div class="resupply-cargo">${metric('Cargo hold', cargo(g, s), s.capacity)}<small>${Math.max(0, s.capacity - cargo(g, s))} cargo space free. Sell cargo to make room for supplies.</small></div>` +
        g.resources
          .filter((resource) => resource.id !== 'credits')
          .map((resource) => {
            const actions = (
              [
                ['Buy 5', 'buy', 5],
                ['Sell 5', 'sell', 5],
                ['Sell 1', 'sell', 1],
              ] as const
            ).map(([label, direction, amount]) => {
              const command: Command = { type: 'trade', resource: resource.id, direction, amount };
              return {
                label,
                command,
                error: dispatch(g, s, command).error,
                id: `trade-${resource.id}-${direction}-${amount}-reason`,
              };
            });
            return `<div class="trade-row"><div><h3>${esc(resource.name)} <span class="accent">${s.inventory[resource.id]}</span></h3><small>${esc(resource.description)}</small><small>Buy ${price(g, s, resource.id, 'buy')} cr · sell ${price(g, s, resource.id, 'sell')} cr per unit</small>${actions
              .filter((action) => action.error)
              .map(
                (action) =>
                  `<small class="trade-reason" id="${action.id}">${esc(action.label)}: ${esc(action.error)}</small>`,
              )
              .join(
                '',
              )}</div><div class="trade-actions">${actions.map((action) => button(action.label, action.command, false, action.id)).join('')}</div></div>`;
          })
          .join(''),
      'LOCAL PRICES',
    )}${panel('Active contracts', active.length ? `<div class="activity-grid">${active.map((m) => missionCard(m.id)).join('')}</div>` : '<p>No active contracts. Accept a job below before you head out.</p>', `${active.length} / 3 ACTIVE`)}</div><div class="stack">${panel('Survey data exchange', `<p>License your unpublished surveys to the station owner. Each record earns 90 credits and +3 standing with the buyer. A rival faction loses 2 standing per record.</p><div class="line"></div><div class="status-lines"><div><span>Unpublished surveys</span><b>${Object.entries(s.discoveries).filter(([id, d]) => d.surveyed && !d.dataSold && !g.locations.find((l) => l.id === id)!.station).length}</b></div><div><span>Buyer</span><b>${esc(g.factions.find((f) => f.id === loc.faction)?.name ?? 'No station')}</b></div></div><div class="row-actions">${button('License survey data', { type: 'sellData' })}</div>`, 'EXCLUSIVE RIGHTS')}${panel('The political cost', `<p>Station prices improve with local standing. Giving relief supplies builds local trust but weakens a rival's claim. Unpopular captains lose access to faction contracts below −40 standing.</p><p style="margin-top:12px">Trade conditions change as fictional years pass during long voyages. Existing accepted contracts remain valid.</p>`, 'READ THE FINE PRINT')}</div></div>${discoveryHistory(g, s)}${recruitmentPanel(g, s, button)}<div class="section-label">Mission board / ${offered.length} CONTRACTS AVAILABLE</div><div class="activity-grid">${offered.map((m) => missionCard(m.id)).join('')}</div>${
      s.missions.some((m) => m.claimed)
        ? `<div class="section-label">Filed contracts</div><p>${s.missions
            .filter((m) => m.claimed)
            .map((m) => esc(g.missions.find((x) => x.id === m.id)!.name))
            .join(' · ')}</p>`
        : ''
    }`;
  }
  function paint() {
    const scene = main.querySelector<HTMLCanvasElement>('#scene');
    if (scene) drawScene(scene, view(g, s).location, s.primary?.kind === 'travel');
    for (const c of main.querySelectorAll<HTMLCanvasElement>('[data-portrait]'))
      drawPortrait(c, Number(c.dataset.portrait));
  }
  function update(next: GameState, definition: GameDefinition, force = false) {
    s = next;
    g = definition;
    const v = view(g, s);
    if (observedRegion !== v.region.id) {
      observedRegion = v.region.id;
      selectedRegion =
        plannedTarget && tab === 'navigation'
          ? (g.locations.find((location) => location.id === plannedTarget)?.region ?? v.region.id)
          : v.region.id;
    }
    root.querySelector('.topbar-location .eyebrow')!.textContent =
      `${g.factions.find((f) => f.id === 'combine')!.name.toUpperCase()} / DEEP FIELD OPERATIONS`;
    root.querySelector('#breadcrumb')!.textContent =
      `${v.region.name.toUpperCase()} SYSTEM · ${v.location.name.toUpperCase()}`;
    root.querySelector('#year-badge')!.textContent = `SHIP YEAR ${v.year}`;
    root.querySelector('#save-status')!.textContent = controller.storageStatus();
    const saveWarning = root.querySelector<HTMLElement>('#save-warning')!;
    const saveError = controller.storageError();
    if (saveWarning.querySelector('span')!.textContent !== saveError)
      saveWarning.querySelector('span')!.textContent = saveError;
    saveWarning.hidden = !saveError;
    if (
      plannedTarget &&
      !g.locations.some(
        (location) => location.id === plannedTarget && s.known.includes(location.id),
      )
    )
      plannedTarget = null;
    const nextSignature = JSON.stringify([
      s.location,
      s.inventory,
      s.integrity,
      s.wear,
      s.capacity,
      s.debt,
      s.crew,
      s.primary?.id,
      s.support?.id,
      s.encounter,
      s.missions,
      s.known,
      s.upgrades,
      s.nextEvent,
      controller.isOwner(),
    ]);
    if (force || nextSignature !== signature) {
      signature = nextSignature;
      const focused =
        document.activeElement instanceof HTMLElement ? document.activeElement.dataset.key : null;
      const titles: Record<string, [string, string, string]> = {
        overview: [
          'FLIGHT DECK / OVERVIEW',
          s.primary?.kind === 'travel' ? 'Between the stars.' : 'A little further out.',
          'The Kestrel is yours. So is whatever comes next.',
        ],
        navigation: [
          'ASTROGATION / FRONTIER CHART',
          'The uncharted awaits.',
          'Resolve the signals. Choose a heading. Mind the return journey.',
        ],
        operations: [
          'VESSEL / EXPEDITION CONTROL',
          'Keep the lights on.',
          'A sound hull, a prepared crew, and enough to make it home.',
        ],
        contacts: [
          'STATION LINK / CONTRACTS & TRADE',
          'Nothing comes for free.',
          'Refuel, find work, and decide whose frontier this will become.',
        ],
      };
      const heading = titles[tab];
      main.classList.toggle('work-focused', tab !== 'overview');
      main.innerHTML = `${!controller.isOwner() ? '<div class="banner">This tab is read-only. Your expedition is active in another tab. Close that tab, then reload here to take command.</div>' : ''}<div class="page-heading"><div><div class="eyebrow">${heading[0]}</div><h1>${heading[1]}</h1><p>${heading[2]}</p></div><div class="coordinate"><span class="accent">${esc(v.region.name.toUpperCase())} SECTOR</span><br>CHARTER FW-017<br>${s.primary?.kind === 'travel' ? 'CRYOSLEEP / IN TRANSIT' : v.location.station ? 'DOCKING LINK ESTABLISHED' : 'ORBITAL LINK ESTABLISHED'}</div></div><div class="resource-strip">${[
        'credits',
        'fuel',
        'parts',
        'ammo',
        'provisions',
      ]
        .map((id) => {
          const r = g.resources.find((r) => r.id === id)!;
          return `<div class="resource"><small>${r.name}</small><strong>${s.inventory[id]}<span>${r.unit}</span></strong></div>`;
        })
        .join(
          '',
        )}</div>${encounter()}${threatPanel(g, s, button, 'Vent contaminated compartment')}${discoveryPanel(g, s, button, tab === 'contacts' ? undefined : '<button data-tab="contacts">Review discovery</button>')}${jobs()}${planningSummary(g, s)}${tab === 'overview' ? overview() : tab === 'navigation' ? navigation() : tab === 'operations' ? operations() : contacts()}<footer class="footer"><span>SV KESTREL / DEEP FIELD SURVEY<br>YOUR PROGRESS CONTINUES WHILE YOU'RE AWAY.</span><span>FAR WAKE v0.12<br>SEED ${s.seed} · LOCAL EXPEDITION</span></footer>`;
      root.classList.toggle('readonly', !controller.isOwner());
      for (const b of root.querySelectorAll<HTMLElement>('.nav-button'))
        b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
      paint();
      if (focused) {
        const target = [...main.querySelectorAll<HTMLElement>('[data-key]')].find(
          (el) => el.dataset.key === focused,
        );
        target?.focus({ preventScroll: true });
      }
    }
    for (const slot of ['primary', 'support'] as const) {
      const j = s[slot];
      if (j) {
        main
          .querySelectorAll(`[data-timer="${slot}"]`)
          .forEach(
            (el) =>
              (el.textContent = s.encounter || threatAlert(s) ? 'HOLDING' : duration(j.remaining)),
          );
        main
          .querySelectorAll<HTMLElement>(`[data-progress="${slot}"]`)
          .forEach((el) => (el.style.width = `${(1 - j.remaining / j.total) * 100}%`));
      }
    }
  }
  function openConfirm(description: string, action: () => void) {
    returnFocus = document.activeElement as HTMLElement;
    confirmAction = action;
    root.querySelector('#confirm-description')!.textContent = description;
    confirmDialog.showModal();
    confirmDialog.querySelector<HTMLButtonElement>('[data-action=cancel]')!.focus();
  }
  function closeConfirm() {
    confirmDialog.close();
    confirmAction = null;
    returnFocus?.focus();
  }
  root.addEventListener('click', async (e) => {
    const target = (e.target as Element).closest<HTMLElement>('button');
    if (!target) return;
    if (target.dataset.routeTarget) {
      const destination = g.locations.find(
        (location) => location.id === target.dataset.routeTarget && s.known.includes(location.id),
      );
      if (!destination) return;
      plannedTarget = destination.id;
      selectedRegion = destination.region;
      tab = 'navigation';
      update(s, g, true);
      main.querySelector<HTMLElement>('#route-plan-title')?.focus();
      main.querySelector('#route-plan-title')?.scrollIntoView({ block: 'start' });
      return;
    }
    if (target.dataset.planningView) {
      const view = target.dataset.planningView;
      tab = view === 'board' || view === 'supplies' ? 'contacts' : 'operations';
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
      if (window.innerWidth <= 640) window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (target.dataset.region) {
      plannedTarget = null;
      selectedRegion = target.dataset.region;
      update(s, g, true);
      return;
    }
    if (target.dataset.command) {
      const command = JSON.parse(target.dataset.command) as Command;
      if (
        command.type === 'activity' &&
        g.activities.find((a) => a.id === command.id)?.effect === 'expose'
      ) {
        openConfirm(
          'This optional investigation can introduce a hidden threat. After it is detected, failed responses may permanently kill crew. Offline time never kills crew. Continue?',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'threat' && command.action === 'purge') {
        openConfirm(
          'Vent the contaminated compartment? This guarantees removal of the threat and preserves the crew, but destroys 20% of all physical cargo.',
          () => controller.command(command),
        );
        return;
      }

      if (command.type === 'travel') {
        const r = routesFrom(g, s).find((r) => r.target === command.target)!;
        if (r.interregional) {
          openConfirm(
            `Commit to ${duration(r.seconds)} real time in cryosleep? ${Math.round((r.days / 365.25) * 10) / 10} fictional years will pass. Cost: ${amountText(r.cost)}. You cannot change course after departure.`,
            () => controller.command(command),
          );
          return;
        }
      }
      if (command.type === 'discovery') {
        const def = g.discoveryEvents!.entries.find((entry) => entry.id === command.id)!;
        if (def.kind === 'choice') {
          const choice = def.choices.find((option) => option.id === command.choice)!;
          openConfirm(
            `${choice.name}? ${choice.description} This decision is final for this expedition.`,
            () => controller.command(command),
          );
        }
        return;
      }
      if (command.type === 'abandon') {
        openConfirm(
          'Release this contract? Its progress will be cleared. You may accept it again at a station.',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'sellData') {
        openConfirm(
          'License all unpublished survey data exclusively to this station? This earns credits and local standing, and reduces standing with a rival faction.',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'rescue') {
        openConfirm(
          'Request a recovery tow? Arrival takes 2 real minutes and adds 150 credits of recovery debt. Your crew and ship remain safe.',
          () => controller.command(command),
        );
        return;
      }
      if (command.type === 'activity' && command.id === 'raid') {
        openConfirm(
          'Approach the hostile contact? An armed encounter will require ammunition, escape propellant, payment, or surrendered cargo.',
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
        root.querySelector<HTMLInputElement>('#sound-setting')!.checked =
          controller.preferences.sound;
        root.querySelector<HTMLInputElement>('#motion-setting')!.checked =
          controller.preferences.motion;
        root.querySelector('#save-details')!.textContent =
          `Seed ${s.seed} · save format 1 · generation ${s.generationVersion} · ${controller.storageStatus()}`;
        settings.showModal();
      }
      if (action === 'close-settings') {
        settings.close();
        returnFocus?.focus();
      }
      if (action === 'backup') {
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = controller.backupSave();
        error.textContent = 'Backup loaded into text. Import it to restore that expedition.';
      }
      if (action === 'export')
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = controller.exportSave();
      if (action === 'copy') {
        const data = controller.exportSave();
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = data;
        try {
          await navigator.clipboard.writeText(data);
          error.textContent = 'Save copied.';
        } catch {
          error.textContent = 'Clipboard unavailable. Select and copy the save text above.';
        }
      }
      if (action === 'download') {
        const url = URL.createObjectURL(
            new Blob([controller.exportSave()], { type: 'application/json' }),
          ),
          a = document.createElement('a');
        a.href = url;
        a.download = `far-wake-${s.seed}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      if (action === 'import') {
        const text = root.querySelector<HTMLTextAreaElement>('#save-text')!.value;
        openConfirm(
          'Replace this expedition with the pasted save? Your current expedition will be backed up on this device.',
          () => {
            try {
              controller.importSave(text);
              settings.close();
              notify('Expedition imported.');
            } catch (e) {
              error.textContent = String((e as Error).message);
            }
          },
        );
      }
      if (action === 'reset') {
        const seed = Number(root.querySelector<HTMLInputElement>('#new-seed')!.value);
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295)
          throw Error('Use a whole seed between 0 and 4294967295.');
        openConfirm(
          'Replace the current expedition with a new charter? Export a save first to keep a portable copy. A local backup will also be kept.',
          () => {
            try {
              controller.reset(seed);
              settings.close();
              notify('New charter activated.');
            } catch (e) {
              error.textContent = (e as Error).message;
            }
          },
        );
      }
      if (action === 'confirm') {
        const fn = confirmAction;
        closeConfirm();
        fn?.();
      }
      if (action === 'cancel') closeConfirm();
    } catch (e) {
      error.textContent = (e as Error).message;
    }
  });
  confirmDialog.addEventListener('cancel', () => {
    confirmAction = null;
  });
  root.addEventListener('change', async (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.member) {
      controller.command({
        type: 'assign',
        member: el.dataset.member,
        assignment: el.value as 'primary' | 'support' | 'rest',
      });
      update(s, g, true);
    }
    if (el.id === 'sound-setting') controller.setSound(el.checked);
    if (el.id === 'motion-setting') controller.setMotion(el.checked);
    if (el.id === 'save-file') {
      const f = el.files?.[0];
      if (f) {
        if (f.size > 1_000_000) {
          root.querySelector('#settings-error')!.textContent = 'File too large.';
          return;
        }
        root.querySelector<HTMLTextAreaElement>('#save-text')!.value = await f.text();
      }
    }
  });
  return { update, notify };
}
