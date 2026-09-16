import type { ReactNode } from 'react';
import { Dialog as Primitive } from 'radix-ui';

export interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Accessible name, shown only to assistive technology when the panel has its own heading. */
    title: string;
    /** One line naming what the panel does, read out after the title. */
    description: string;
    className?: string;
    children: ReactNode;
}

/**
 * A panel over the page, with the focus trap and the escape key already handled.
 *
 * Hand-rolling this is how a search box becomes a keyboard trap: the primitive returns focus to
 * whatever opened it, marks the rest of the page inert, and closes on escape without a listener
 * of ours to forget.
 */
export function Dialog({ open, onOpenChange, title, description, className, children }: DialogProps) {
    return (
        <Primitive.Root open={open} onOpenChange={onOpenChange}>
            <Primitive.Portal>
                <Primitive.Overlay className="overlay" />
                <Primitive.Content className={className}>
                    <Primitive.Title className="visually-hidden">{title}</Primitive.Title>
                    <Primitive.Description className="visually-hidden">{description}</Primitive.Description>
                    {children}
                </Primitive.Content>
            </Primitive.Portal>
        </Primitive.Root>
    );
}
