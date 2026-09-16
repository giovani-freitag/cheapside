import type { ReactNode } from 'react';
import { Tabs as Primitive } from 'radix-ui';

export interface TabDefinition<T extends string> {
    value: T;
    label: string;
    /** A count shown beside the label, when the section has an obvious size. */
    badge?: number;
}

export interface TabsProps<T extends string> {
    /** Accessible name for the tab list. */
    label: string;
    value: T;
    onValueChange: (value: T) => void;
    tabs: readonly TabDefinition<T>[];
    children: ReactNode;
}

/**
 * Sections of one page, one at a time.
 *
 * The arrows walk the list and only the open tab is in the tab order, which is what four
 * buttons and four conditionals would not have given.
 */
export function Tabs<T extends string>({ label, value, onValueChange, tabs, children }: TabsProps<T>) {
    return (
        <Primitive.Root
            className="tabs"
            value={value}
            onValueChange={(next) => {
                onValueChange(next as T);
            }}
        >
            <Primitive.List className="tabs__list" aria-label={label}>
                {tabs.map((tab) => (
                    <Primitive.Trigger key={tab.value} className="tabs__trigger" value={tab.value}>
                        {tab.label}
                        {tab.badge === undefined ? null : <span className="tabs__badge">{tab.badge}</span>}
                    </Primitive.Trigger>
                ))}
            </Primitive.List>
            {children}
        </Primitive.Root>
    );
}

export interface TabPanelProps<T extends string> {
    value: T;
    children: ReactNode;
}

/** The body of one tab. */
export function TabPanel<T extends string>({ value, children }: TabPanelProps<T>) {
    return (
        <Primitive.Content className="tabs__panel" value={value}>
            {children}
        </Primitive.Content>
    );
}
