import { AppShell } from '@/react/components/app-shell.tsx';
import { ServicesProvider } from '@/react/providers/services-provider.tsx';

/** The application, which is one screen over a dataset that changed at build time. */
export function App() {
    return (
        <ServicesProvider>
            <AppShell />
        </ServicesProvider>
    );
}
