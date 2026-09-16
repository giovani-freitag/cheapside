import { useEffect } from 'react';

/**
 * Binds one command shortcut while the component is mounted.
 *
 * The listener sits on the document rather than on a field, because the whole point of a command
 * shortcut is that it answers from wherever the reader's focus happens to be. Both modifiers are
 * accepted so the same key works on a Mac and on everything else.
 *
 * @param key - The letter pressed with Meta or Control, lower case.
 * @param run - What to do when it is pressed.
 */
export function useHotkey(key: string, run: () => void): void {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) return;
            if (!event.metaKey && !event.ctrlKey) return;
            if (event.key.toLowerCase() !== key) return;
            /* Inside a field the same chord belongs to the field — Ctrl+K deletes to end of line. */
            if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select')) return;

            event.preventDefault();
            run();
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [key, run]);
}
