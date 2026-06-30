const DEBUG_STORAGE_KEY = 'astro-inspect-clip:debug:v1';

export interface InspectClipDebugApi {
  enable(): boolean;
  disable(): boolean;
  toggle(force?: boolean): boolean;
  status(): boolean;
}

function readStoredDebugFlag(): boolean {
  try {
    const stored = window.sessionStorage.getItem(DEBUG_STORAGE_KEY)
      ?? window.localStorage.getItem(DEBUG_STORAGE_KEY);
    return stored === '1' || stored === 'true';
  } catch {
    return false;
  }
}

export function isDebugEnabled(): boolean {
  if (typeof window.__astro_inspect_clip_debug__ === 'boolean') {
    return window.__astro_inspect_clip_debug__;
  }

  return readStoredDebugFlag();
}

export function setDebugEnabled(enabled: boolean): boolean {
  window.__astro_inspect_clip_debug__ = enabled;

  try {
    if (enabled) {
      window.sessionStorage.setItem(DEBUG_STORAGE_KEY, '1');
    } else {
      window.sessionStorage.removeItem(DEBUG_STORAGE_KEY);
      window.localStorage.removeItem(DEBUG_STORAGE_KEY);
    }
  } catch {}

  debugLog('debug-mode', { enabled });
  return enabled;
}

export function installDebugApi(): void {
  window.__astroInspectClipDebug = {
    enable: () => setDebugEnabled(true),
    disable: () => setDebugEnabled(false),
    toggle: (force?: boolean) => setDebugEnabled(force ?? !isDebugEnabled()),
    status: () => isDebugEnabled(),
  };
}

export function debugLog(event: string, detail?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;

  if (detail) {
    console.debug('[astro-inspect-clip]', event, detail);
  } else {
    console.debug('[astro-inspect-clip]', event);
  }
}
