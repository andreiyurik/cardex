/**
 * URL <-> state helpers so a filled calculation is shareable and
 * bookmarkable without any backend. Islands are client-only, so
 * `window` is always available here.
 */

export function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/** Replace the query string without adding a history entry. */
export function writeParams(params: URLSearchParams): void {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const url = window.location.pathname + (qs ? `?${qs}` : '');
  window.history.replaceState(null, '', url);
}

/** Copy the current page URL (with state) to the clipboard. */
export async function copyCurrentUrl(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
