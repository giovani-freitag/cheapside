/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from '@/services/theme/theme-service.ts';
import { createBlockedStorage, createMediaQuery, createMemoryStorage } from '../../../mocks/dom.ts';

function build(options: { stored?: string; deviceIsDark?: boolean; storage?: Storage } = {}) {
    const storage = options.storage ?? createMemoryStorage();
    if (options.stored) storage.setItem('cheapside.theme', options.stored);

    const root = document.createElement('html');
    const darkQuery = createMediaQuery(options.deviceIsDark ?? false);
    const service = new ThemeService({ storage, root, darkQuery });

    return { service, root, darkQuery, storage };
}

describe('ThemeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('follows the device when nothing was chosen before', () => {
        const { service } = build();

        expect(service.preference).toBe('system');
    });

    it('paints dark when the device asks for dark and nothing was chosen', () => {
        const { service } = build({ deviceIsDark: true });

        expect(service.surface).toBe('dark');
    });

    it('stamps the surface on the root element as soon as it is built', () => {
        const { root } = build({ deviceIsDark: true });

        expect(root.dataset.surface).toBe('dark');
    });

    it('restores a choice made on an earlier visit', () => {
        const { service } = build({ stored: 'dark', deviceIsDark: false });

        expect(service.surface).toBe('dark');
    });

    it('ignores a stored value that is not a theme', () => {
        const { service } = build({ stored: 'sepia' });

        expect(service.preference).toBe('system');
    });

    it('overrides the device once the reader chooses', () => {
        const { service } = build({ deviceIsDark: true });

        service.choose('light');

        expect(service.surface).toBe('light');
    });

    it('remembers the choice for the next visit', () => {
        const { service, storage } = build();

        service.choose('dark');

        expect(storage.getItem('cheapside.theme')).toBe('dark');
    });

    it('follows the device again when the reader goes back to system', () => {
        const { service, darkQuery } = build({ stored: 'light' });

        service.choose('system');
        darkQuery.flip(true);

        expect(service.surface).toBe('dark');
    });

    it('repaints when the device flips while the page sits still', () => {
        const { root, darkQuery } = build();

        darkQuery.flip(true);

        expect(root.dataset.surface).toBe('dark');
    });

    it('does not follow the device once a theme has been chosen', () => {
        const { service, darkQuery } = build({ stored: 'light' });

        darkQuery.flip(true);

        expect(service.surface).toBe('light');
    });

    it('tells subscribers what is now painted', () => {
        const { service, darkQuery } = build();
        const seen: string[] = [];

        service.subscribe((surface) => {
            seen.push(surface);
        });
        darkQuery.flip(true);

        expect(seen).toEqual(['dark']);
    });

    it('stops telling a subscriber that cancelled', () => {
        const { service, darkQuery } = build();
        const seen: string[] = [];

        const cancel = service.subscribe((surface) => {
            seen.push(surface);
        });
        cancel();
        darkQuery.flip(true);

        expect(seen).toEqual([]);
    });

    it('still works where the browser refuses storage', () => {
        const { service } = build({ storage: createBlockedStorage() });

        service.choose('dark');

        expect(service.surface).toBe('dark');
    });
});
