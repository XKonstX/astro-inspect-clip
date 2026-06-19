import type { CommentedContextEntry, SelectedEntry } from '../src/types.ts';

class MemoryStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export function installWindow(options: { root?: string; pathname?: string } = {}) {
  const storage = new MemoryStorage();
  const win = {
    sessionStorage: storage,
    location: {
      origin: 'http://127.0.0.1:4322',
      pathname: options.pathname ?? '/',
    },
    __astro_dev_toolbar__: options.root ? { root: options.root } : undefined,
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: win,
  });

  return win;
}

export function makeEntry(overrides: Partial<SelectedEntry> = {}): SelectedEntry {
  return {
    element: { tagName: 'BUTTON', className: 'cta' } as HTMLElement,
    info: {
      filePath: '/repo/src/components/Button.astro',
      relativePath: 'src/components/Button.astro',
      location: '12:4',
      tagName: 'button',
      classes: 'cta',
      htmlSnippet: '<button class="cta">Click</button>',
    },
    isInherited: false,
    ...overrides,
  };
}

export function makeContext(overrides: Partial<CommentedContextEntry> = {}): CommentedContextEntry {
  return {
    id: '/repo/src/components/Button.astro::12:4::button::button.cta:nth-of-type(1)',
    instanceKey: 'button.cta:nth-of-type(1)',
    filePath: '/repo/src/components/Button.astro',
    relativePath: 'src/components/Button.astro',
    location: '12:4',
    tagName: 'button',
    classes: 'cta',
    htmlSnippet: '<button class="cta">Click</button>',
    instruction: 'Make it clearer.',
    isInherited: false,
    ...overrides,
  };
}
