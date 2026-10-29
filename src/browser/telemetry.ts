/** Browser-only PostHog adapter. No state, command payload or raw error crosses this boundary. */
import './telemetry.css';
export type Surface = 'library' | 'far-wake' | 'hollowmere';
export const OPT_OUT_KEY = 'explorer.telemetry.optOut';
export const ORDERS = [
  'discovery',
  'travel',
  'activity',
  'hire',
  'threat',
  'work',
  'cancelWorkWatch',
  'rescue',
  'accept',
  'claim',
  'abandon',
  'trade',
  'assign',
  'encounter',
  'sellData',
  'aid',
  'upgrade',
] as const;
export const PROGRESS = ['arrived', 'activityComplete'] as const;
const ERROR_TYPES = [
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'AggregateError',
];
type Usage =
  | { event: 'explorer_opened' }
  | { event: 'explorer_order'; kind: string }
  | { event: 'explorer_progress'; kind: string }
  | { event: 'explorer_sitting'; minutes: number }
  | {
      event: '$exception';
      errorType: string;
      origin: 'error' | 'rejection';
      line?: number;
      column?: number;
    };
export function telemetryAllowed(production: boolean, href: string, token: string, host: string) {
  try {
    const url = new URL(href),
      endpoint = new URL(host);
    return (
      production &&
      !!token &&
      endpoint.protocol === 'https:' &&
      !endpoint.username &&
      !endpoint.password &&
      url.origin === 'https://rayners.github.io' &&
      [
        '/explorer/',
        '/explorer/index.html',
        '/explorer/far-wake/',
        '/explorer/far-wake/index.html',
        '/explorer/hollowmere/',
        '/explorer/hollowmere/index.html',
      ].includes(url.pathname) &&
      !['speed', 'debug', '__posthog_debug'].some((key) => url.searchParams.has(key))
    );
  } catch {
    return false;
  }
}
/** Rebuild payloads rather than merging arbitrary properties. */
export function captureBody(
  surface: Surface,
  release: string,
  token: string,
  distinctId: string,
  usage: Usage,
) {
  const properties: Record<string, unknown> = {
    app: 'explorer',
    surface,
    release,
    telemetry_version: 1,
    $process_person_profile: false,
    $geoip_disable: true,
    $ip: null,
  };
  if (usage.event === 'explorer_order') {
    if (!(ORDERS as readonly string[]).includes(usage.kind)) return null;
    properties.kind = usage.kind;
  } else if (usage.event === 'explorer_progress') {
    if (!(PROGRESS as readonly string[]).includes(usage.kind)) return null;
    properties.kind = usage.kind;
  } else if (usage.event === 'explorer_sitting') {
    if (!Number.isFinite(usage.minutes) || usage.minutes < 1) return null;
    properties.minutes = Math.min(1440, Math.floor(usage.minutes));
  } else if (usage.event === '$exception') {
    const type = ERROR_TYPES.includes(usage.errorType) ? usage.errorType : 'Error';
    properties.origin = usage.origin === 'rejection' ? 'rejection' : 'error';
    const coordinate = (n: number | undefined) =>
      Number.isSafeInteger(n) && n! > 0 && n! <= 10_000_000 ? n! : 0;
    properties.line = coordinate(usage.line);
    properties.column = coordinate(usage.column);
    properties.$exception_list = [
      { type, value: `Sanitized ${type}`, mechanism: { handled: false, synthetic: true } },
    ];
    properties.$exception_fingerprint = `explorer:${surface}:${type}:${properties.origin}:${properties.line}:${properties.column}`;
  } else if (usage.event !== 'explorer_opened') return null;
  return { api_key: token, distinct_id: distinctId, event: usage.event, properties };
}
export function createTelemetry(options: {
  surface: Surface;
  release: string;
  token: string;
  host: string;
  allowed: boolean;
  sharing: () => boolean;
  online: () => boolean;
  id: () => string;
  send: (url: string, init: RequestInit) => Promise<unknown>;
}) {
  let id: string | undefined,
    sent = 0,
    errors = 0;
  return {
    track(usage: Usage) {
      try {
        if (
          !options.allowed ||
          !options.sharing() ||
          !options.online() ||
          sent >= 200 ||
          (usage.event === '$exception' && errors >= 10)
        )
          return;
        const body = captureBody(
          options.surface,
          options.release,
          options.token,
          (id ??= options.id()),
          usage,
        );
        if (!body) return;
        sent++;
        if (usage.event === '$exception') errors++;
        void options
          .send(`${options.host.replace(/\/$/, '')}/i/v0/e/?ip=0`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(body),
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            keepalive: true,
          })
          .catch(() => {
            /* No retries, persistence or gameplay failure. */
          });
      } catch {
        /* Privacy/storage/network failures must not affect play. */
      }
    },
  };
}
let disabledInMemory = false;
function browserSignal() {
  return (
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}
export function sharingUsage() {
  try {
    return !disabledInMemory && !browserSignal() && localStorage.getItem(OPT_OUT_KEY) !== '1';
  } catch {
    return false;
  }
}
export function mountTelemetryPreference(parent: HTMLElement) {
  const section = document.createElement('div');
  section.className = 'telemetry-preference';
  section.innerHTML =
    '<label><input type="checkbox"> Share usage and sanitized error reports</label><small>PostHog receives game usage and error categories. No names, saves, page URLs or persistent player ID. Applies to all Explorer games on this device. Browser privacy signals disable sharing.</small><p role="status"></p>';
  const input = section.querySelector('input')!,
    status = section.querySelector('p')!;
  function refresh() {
    input.checked = sharingUsage();
    input.disabled = browserSignal();
  }
  input.addEventListener('change', () => {
    disabledInMemory = !input.checked;
    try {
      localStorage.setItem(OPT_OUT_KEY, input.checked ? '0' : '1');
      disabledInMemory = false;
      status.textContent = '';
    } catch {
      disabledInMemory = true;
      status.textContent =
        'Sharing is off here. This preference could not be saved; check it again after reopening.';
    }
    refresh();
    window.dispatchEvent(new Event('explorer-privacy-change'));
  });
  addEventListener('storage', refresh);
  addEventListener('explorer-privacy-change', refresh);
  refresh();
  parent.append(section);
}
export function startTelemetry(surface: Surface) {
  const token = import.meta.env.VITE_POSTHOG_TOKEN ?? '',
    host = import.meta.env.VITE_POSTHOG_HOST ?? '';
  const recorder = createTelemetry({
    surface,
    release: __APP_VERSION__,
    token,
    host,
    allowed: telemetryAllowed(import.meta.env.PROD, location.href, token, host),
    sharing: sharingUsage,
    online: () => navigator.onLine,
    id: () => crypto.randomUUID(),
    send: (url, init) => fetch(url, init),
  });
  recorder.track({ event: 'explorer_opened' });
  let shownAt: number | null = document.hidden ? null : performance.now();
  const finish = () => {
    if (shownAt === null) return;
    recorder.track({ event: 'explorer_sitting', minutes: (performance.now() - shownAt) / 60000 });
    shownAt = null;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish();
    else shownAt = performance.now();
  });
  addEventListener('pagehide', finish);
  addEventListener('pageshow', () => {
    if (!document.hidden && shownAt === null) shownAt = performance.now();
  });
  addEventListener('explorer-privacy-change', () => {
    shownAt = sharingUsage() && !document.hidden ? performance.now() : null;
  });
  addEventListener('storage', (event) => {
    if (event.key === OPT_OUT_KEY || event.key === null)
      shownAt = sharingUsage() && !document.hidden ? performance.now() : null;
  });
  addEventListener('error', (event) => {
    recorder.track({
      event: '$exception',
      errorType: safeErrorType(event.error),
      origin: 'error',
      line: event.lineno,
      column: event.colno,
    });
  });
  addEventListener('unhandledrejection', (event) => {
    recorder.track({
      event: '$exception',
      errorType: safeErrorType(event.reason),
      origin: 'rejection',
    });
  });
  return recorder;
}
function safeErrorType(value: unknown): string {
  try {
    return value instanceof Error && ERROR_TYPES.includes(value.name) ? value.name : 'Error';
  } catch {
    return 'Error';
  }
}
