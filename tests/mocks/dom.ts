import { vi } from 'vitest';

/** A storage that behaves, for the path where the browser allows one. */
export function createMemoryStorage(): Storage {
    const entries = new Map<string, string>();

    return {
        get length() {
            return entries.size;
        },
        clear: vi.fn(() => { entries.clear(); }),
        getItem: vi.fn((key: string) => entries.get(key) ?? null),
        key: vi.fn((index: number) => [...entries.keys()][index] ?? null),
        removeItem: vi.fn((key: string) => {
            entries.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
            entries.set(key, value);
        }),
    };
}

/** A storage that throws on every access, as a private window with site data blocked does. */
export function createBlockedStorage(): Storage {
    const refuse = () => {
        throw new Error('storage is blocked');
    };

    return {
        length: 0,
        clear: vi.fn(refuse),
        getItem: vi.fn(refuse),
        key: vi.fn(refuse),
        removeItem: vi.fn(refuse),
        setItem: vi.fn(refuse),
    };
}

export interface FakeMediaQuery extends MediaQueryList {
    /** Flips the query and notifies whoever subscribed, as a device changing theme would. */
    flip: (matches: boolean) => void;
}

/** A media query a test can drive, standing in for the device's colour-scheme preference. */
export function createMediaQuery(matches: boolean): FakeMediaQuery {
    const listeners = new Set<() => void>();

    const query = {
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn((_type: string, listener: () => void) => {
            listeners.add(listener);
        }),
        removeEventListener: vi.fn((_type: string, listener: () => void) => {
            listeners.delete(listener);
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
        flip: (next: boolean) => {
            query.matches = next;
            for (const listener of listeners) listener();
        },
    };

    return query;
}
