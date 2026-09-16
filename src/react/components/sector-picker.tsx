import { useId, useMemo } from 'react';
import { ALL_SECTORS } from '@/react/hooks/view/use-screen-view.ts';
import { Select } from '@/react/ui/select.tsx';

export interface SectorPickerProps {
    sectors: readonly string[];
    value: string;
    onChange: (sector: string) => void;
    /** How many rows survive the current choice, so an empty result explains itself. */
    showing: number;
    /** What the rows are, for the count to read as a sentence. */
    noun: string;
}

/**
 * Narrows the table to one sector without re-ranking it.
 *
 * A single control rather than a row of chips: there are thirty-odd sectors in the eligible list,
 * and a control that needs two lines of the page to offer a choice most readers will not make is
 * the wrong size for the job it does.
 */
export function SectorPicker({ sectors, value, onChange, showing, noun }: SectorPickerProps) {
    const labelId = useId();

    const options = useMemo(
        () =>
            sectors.map((sector) => ({
                value: sector,
                label: sector === ALL_SECTORS ? 'Todos os setores' : sector,
            })),
        [sectors],
    );

    return (
        <div className="sector-picker">
            <span className="label" id={labelId}>
                Setor
            </span>
            <Select labelledBy={labelId} value={value} onValueChange={onChange} options={options} />
            {value === ALL_SECTORS ? null : (
                <span className="faint sector-picker__count">
                    {showing === 0 ? `nenhuma ${noun} neste setor` : `${String(showing)} ${noun}`}
                </span>
            )}
        </div>
    );
}
