import { Check, ChevronDown } from 'lucide-react';
import { Select as Primitive } from 'radix-ui';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    /** Id of the visible label, so the control is named by the same words the reader sees. */
    labelledBy: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly SelectOption[];
}

/**
 * A choice from a long list, drawn in the page's own palette.
 *
 * The native control is the browser's, not ours: on Windows it opens a white system menu in the
 * middle of a dark page, and it cannot show a check beside the option in force. This one takes
 * its colours from the same tokens as everything else and keeps the keyboard behaviour — type to
 * jump, arrows to walk, escape to leave — because the primitive already implements it.
 */
export function Select({ labelledBy, value, onValueChange, options }: SelectProps) {
    return (
        <Primitive.Root value={value} onValueChange={onValueChange}>
            <Primitive.Trigger className="select" aria-labelledby={labelledBy}>
                <Primitive.Value />
                <Primitive.Icon className="select__caret">
                    <ChevronDown size={15} aria-hidden />
                </Primitive.Icon>
            </Primitive.Trigger>
            <Primitive.Portal>
                <Primitive.Content className="select__menu" position="popper" sideOffset={6}>
                    <Primitive.Viewport className="select__list">
                        {options.map((option) => (
                            <Primitive.Item key={option.value} className="select__option" value={option.value}>
                                <Primitive.ItemIndicator className="select__tick">
                                    <Check size={14} aria-hidden />
                                </Primitive.ItemIndicator>
                                <Primitive.ItemText>{option.label}</Primitive.ItemText>
                            </Primitive.Item>
                        ))}
                    </Primitive.Viewport>
                </Primitive.Content>
            </Primitive.Portal>
        </Primitive.Root>
    );
}
