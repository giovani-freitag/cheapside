import { useContext } from 'react';
import type { Services } from '@/composition-root.ts';
import { ServicesContext } from '@/react/providers/services-context.ts';

/**
 * The services, for a component mounted under the provider.
 *
 * @returns Every service the interface talks to.
 * @throws Error when called outside the provider, which is a wiring mistake and not a state.
 */
export function useServices(): Services {
    const services = useContext(ServicesContext);
    if (!services) throw new Error('Os serviços só existem dentro do ServicesProvider.');

    return services;
}
