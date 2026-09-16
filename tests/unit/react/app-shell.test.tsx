/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScreenDataset } from '@/data/schema.ts';
import { App } from '@/react/app.tsx';
import published from '@/data/generated/screen.json';

const dataset = published as ScreenDataset;

describe('the page', () => {
    it('names itself', () => {
        render(<App />);

        expect(screen.getByRole('heading', { level: 1, name: 'Cheapside' })).toBeDefined();
    });

    it('opens on the portfolio', () => {
        render(<App />);

        expect(screen.getByRole('tab', { name: /A carteira/, selected: true })).toBeDefined();
    });

    it('lists the cheapest company first', () => {
        render(<App />);

        const rows = screen.getAllByRole('row');

        expect(within(rows[1]).getByText(dataset.portfolio[0]?.ticker ?? '')).toBeDefined();
    });

    it('keeps the working folded away until it is asked for', () => {
        render(<App />);

        expect(screen.queryByText('= Valor da firma (EV)')).toBeNull();
    });

    it('unfolds the working behind a rank', async () => {
        render(<App />);

        await userEvent.click(screen.getAllByRole('button', { name: /Ver a conta/ })[0]);

        expect(screen.getByText('= Valor da firma (EV)')).toBeDefined();
    });

    it('says a company has not been read rather than leaving the space blank', async () => {
        render(<App />);

        await userEvent.click(screen.getAllByRole('button', { name: /Ver a conta/ })[0]);

        expect(screen.getByText(/ainda não foram lidas/)).toBeDefined();
    });

    it('shows the removals with their reasons', async () => {
        render(<App />);

        await userEvent.click(screen.getByRole('tab', { name: /O que ficou de fora/ }));

        expect(screen.getByText(/a demonstração não tem linha de EBIT/)).toBeDefined();
    });

    it('publishes the thresholds it applied', async () => {
        render(<App />);

        await userEvent.click(screen.getByRole('tab', { name: /O método/ }));

        expect(screen.getByText('Piso de liquidez')).toBeDefined();
    });

    it('says when the screen was apurado', () => {
        render(<App />);

        expect(screen.getByText(/Apurado em/)).toBeDefined();
    });

    it('offers the three themes', () => {
        render(<App />);

        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });
});
