/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScreenDataset } from '@/data/schema.ts';
import { App } from '@/react/app.tsx';
import { EXCLUSION_LABEL } from '@/domain/enums/exclusion-reason.ts';
import published from '@/data/generated/screen.json';

const dataset = published as ScreenDataset;

async function openSearch(): Promise<void> {
    await userEvent.click(screen.getByRole('button', { name: /Buscar ticker/ }));
}

describe('the ticker search', () => {
    it('places a published company by its position', async () => {
        render(<App />);
        const first = dataset.portfolio[0]?.ticker ?? '';

        await openSearch();
        await userEvent.type(screen.getByLabelText(/Ticker ou nome/), first);

        expect(screen.getByText('#1 na carteira')).toBeDefined();
    });

    it('answers for a company the screen removed with the filter that removed it', async () => {
        render(<App />);
        const dropped = dataset.excluded[0];

        await openSearch();
        await userEvent.type(screen.getByLabelText(/Ticker ou nome/), dropped?.ticker ?? '');

        expect(screen.getByText(EXCLUSION_LABEL[dropped?.reason ?? 'illiquid'])).toBeDefined();
    });

    it('finds a company by name, accents and all', async () => {
        render(<App />);

        await openSearch();
        await userEvent.type(screen.getByLabelText(/Ticker ou nome/), 'allie');

        expect(within(screen.getByRole('dialog')).getByText('ALLD3')).toBeDefined();
    });

    it('unfolds the working of the company it found', async () => {
        render(<App />);
        const first = dataset.portfolio[0]?.ticker ?? '';

        await openSearch();
        await userEvent.type(screen.getByLabelText(/Ticker ou nome/), first);
        await userEvent.click(screen.getByText('#1 na carteira'));

        expect(screen.getByText('= Valor da firma (EV)')).toBeDefined();
    });

    it('says nothing was found rather than showing an empty panel', async () => {
        render(<App />);

        await openSearch();
        await userEvent.type(screen.getByLabelText(/Ticker ou nome/), 'zzzz');

        expect(screen.getByText(/Nenhuma companhia com/)).toBeDefined();
    });
});
