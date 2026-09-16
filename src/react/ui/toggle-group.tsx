import type { ReactNode } from 'react';
import { ToggleGroup as Primitive } from 'radix-ui';

export interface ToggleGroupProps<T extends string> {
    /** Accessible name for the group. */
    label: string;
    className: string;
    value: T;
    onValueChange: (value: T) => void;
    children: ReactNode;
}

/**
 * A row of choices where exactly one is taken.
 *
 * Pressing the choice already taken is ignored rather than clearing it: there is no such thing
 * as no theme, and a row that could reach that state would have to invent one.
 */
export function ToggleGroup<T extends string>({
    label,
    className,
    value,
    onValueChange,
    children,
}: ToggleGroupProps<T>) {
    return (
        <Primitive.Root
            type="single"
            className={className}
            aria-label={label}
            value={value}
            onValueChange={(next) => {
                if (next) onValueChange(next as T);
            }}
        >
            {children}
        </Primitive.Root>
    );
}

export interface ToggleItemProps {
    value: string;
    label: string;
    children: ReactNode;
}

/** One choice in the row. */
export function ToggleItem({ value, label, children }: ToggleItemProps) {
    return (
        <Primitive.Item className="toggle-group__item" value={value} aria-label={label} title={label}>
            {children}
        </Primitive.Item>
    );
}
