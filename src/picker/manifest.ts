/** Keep the original Far Wake install identity while moving its starting page. */
export function farWakeManifest(source: Record<string, unknown>, base: string) {
  const normalized = base.endsWith('/') ? base : base + '/';
  return { ...source, id: normalized, start_url: './far-wake/', scope: './far-wake/' };
}
