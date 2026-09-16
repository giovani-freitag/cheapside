import { Monitor, Moon, Sun } from 'lucide-react';
import { ToggleGroup, ToggleItem } from '@/react/ui/toggle-group.tsx';
import { useTheme } from '@/react/hooks/dom/use-theme.ts';

/** Light, dark, or whatever the device is already doing. */
export function ThemePicker() {
    const { preference, choose } = useTheme();

    return (
        <ToggleGroup label="Tema" className="toggle-group" value={preference} onValueChange={choose}>
            <ToggleItem value="light" label="Claro">
                <Sun size={15} aria-hidden />
            </ToggleItem>
            <ToggleItem value="dark" label="Escuro">
                <Moon size={15} aria-hidden />
            </ToggleItem>
            <ToggleItem value="system" label="Do sistema">
                <Monitor size={15} aria-hidden />
            </ToggleItem>
        </ToggleGroup>
    );
}
