import type { ReactNode } from 'react';
import { Tabs as Primitive } from 'radix-ui';

export interface TabDefinition<T extends string> {
    value: T;
    label: string;
    /** The section as a shape, for the bar at the bottom of a phone. */
    icon: ReactNode;
    /** The same section in one word, for the thumb bar at the bottom of a phone. */
    short: string;
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
 *
 * Each trigger carries both wordings and CSS shows one: on a phone the list is a bar at the
 * bottom of the screen, where a thumb reaches, and a label that reads "O que ficou de fora" in a
 * ninety-pixel cell reads as nothing at all.
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
                        <span className="tabs__icon" aria-hidden>
                            {tab.icon}
                        </span>
                        <span className="tabs__long">{tab.label}</span>
                        <span className="tabs__short">{tab.short}</span>
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
