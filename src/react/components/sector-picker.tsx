import { ALL_SECTORS } from '@/react/hooks/view/use-screen-view.ts';

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
 * A plain select rather than a row of chips: there are thirty-odd sectors in the eligible list,
 * and a control that needs two lines of the page to offer a choice most readers will not make is
 * the wrong size for the job it does.
 */
export function SectorPicker({ sectors, value, onChange, showing, noun }: SectorPickerProps) {
    return (
        <div className="sector-picker">
            <label className="label" htmlFor="sector">
                Setor
            </label>
            <select
                id="sector"
                className="sector-picker__select"
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
            >
                {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                        {sector === ALL_SECTORS ? 'Todos os setores' : sector}
                    </option>
                ))}
            </select>
            {value === ALL_SECTORS ? null : (
                <span className="faint sector-picker__count">
                    {showing === 0 ? `nenhuma ${noun} neste setor` : `${String(showing)} ${noun}`}
                </span>
            )}
        </div>
    );
}
