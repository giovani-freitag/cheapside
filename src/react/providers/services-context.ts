import { createContext } from 'react';
import type { Services } from '@/composition-root.ts';

/** Undefined until the provider mounts, which is what lets the hook refuse to guess. */
export const ServicesContext = createContext<Services | undefined>(undefined);
