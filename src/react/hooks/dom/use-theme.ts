import { useCallback, useSyncExternalStore } from 'react';
import type { Surface, ThemeChoice } from '@/services/theme/theme-service.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

export interface ThemeControl {
    /** What the reader asked for. */
    preference: ThemeChoice;
    /** What is painted, once `system` has been resolved against the device. */
    surface: Surface;
    choose: (choice: ThemeChoice) => void;
}

/**
 * The theme, as a component reads and changes it.
 *
 * Subscribed rather than held in state, because the surface also changes when nothing in React
 * did — a device flipping to dark at sunset moves it while the page sits still.
 */
export function useTheme(): ThemeControl {
    const { theme } = useServices();

    const subscribe = useCallback(
        (onChange: () => void) =>
            theme.subscribe(() => {
                onChange();
            }),
        [theme],
    );

    const surface = useSyncExternalStore(subscribe, () => theme.surface);
    const preference = useSyncExternalStore(subscribe, () => theme.preference);

    const choose = useCallback(
        (choice: ThemeChoice) => {
            theme.choose(choice);
        },
        [theme],
    );

    return { preference, surface, choose };
}
