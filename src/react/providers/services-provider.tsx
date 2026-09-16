import { type ReactNode, useState } from 'react';
import { ServicesContext } from '@/react/providers/services-context.ts';
import { createServices } from '@/composition-root.ts';

export interface ServicesProviderProps {
    children: ReactNode;
}

/**
 * Builds the services once and puts them under the tree.
 *
 * Lazy state rather than a module-level constant, so a test can mount two independent trees and
 * so the theme service does not reach for `document` at import time.
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
    const [services] = useState(createServices);

    return <ServicesContext value={services}>{children}</ServicesContext>;
}
