/** What the reader asked for, which is not always what is painted. */
export const THEME_CHOICES = ['light', 'dark', 'system'] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** What is actually painted, once `system` has been resolved against the device. */
export type Surface = 'light' | 'dark';

export interface ThemeServiceConfig {
    /** Where the choice is remembered between visits. */
    storage: Storage;
    /** The element the surface is stamped on, which the stylesheet selects against. */
    root: HTMLElement;
    /** The dark-scheme query, injected so the service can be driven in a test. */
    darkQuery: MediaQueryList;
    /** Key the choice is stored under. */
    storageKey?: string;
}

const DEFAULT_KEY = 'cheapside.theme';

/**
 * Remembers whether the reader wants light, dark, or whatever the device wants.
 *
 * `system` is a standing subscription rather than a one-off reading: a device that flips to dark
 * at sunset should take the page with it, and a page that only checked at load would sit there
 * glowing. The index page paints the first surface inline before React exists, so this never has
 * to correct a flash of the wrong one.
 */
export class ThemeService {
    private readonly storage: Storage;
    private readonly root: HTMLElement;
    private readonly darkQuery: MediaQueryList;
    private readonly storageKey: string;
    private readonly listeners = new Set<(surface: Surface) => void>();
    private choice: ThemeChoice;

    constructor(config: ThemeServiceConfig) {
        this.storage = config.storage;
        this.root = config.root;
        this.darkQuery = config.darkQuery;
        this.storageKey = config.storageKey ?? DEFAULT_KEY;
        this.choice = this.readStored();

        this.darkQuery.addEventListener('change', () => {
            this.paint();
        });
        this.paint();
    }

    /** What the reader asked for. */
    public get preference(): ThemeChoice {
        return this.choice;
    }

    /** What is on screen right now. */
    public get surface(): Surface {
        return this.choice === 'system' ? (this.darkQuery.matches ? 'dark' : 'light') : this.choice;
    }

    /**
     * Changes the theme and remembers the choice.
     *
     * @param choice - Light, dark, or follow the device.
     */
    public choose(choice: ThemeChoice): void {
        this.choice = choice;

        // A browser with site data blocked throws on write; the theme still applies for the visit.
        try {
            this.storage.setItem(this.storageKey, choice);
        } catch {
            /* the choice simply will not survive the visit */
        }

        this.paint();
    }

    /**
     * Subscribes to changes of the painted surface.
     *
     * @param listener - Called with the new surface whenever it changes.
     * @returns A function that cancels the subscription.
     */
    public subscribe(listener: (surface: Surface) => void): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private paint(): void {
        this.root.dataset.surface = this.surface;
        for (const listener of this.listeners) listener(this.surface);
    }

    private readStored(): ThemeChoice {
        try {
            const stored = this.storage.getItem(this.storageKey);

            return stored === 'light' || stored === 'dark' ? stored : 'system';
        } catch {
            return 'system';
        }
    }
}
