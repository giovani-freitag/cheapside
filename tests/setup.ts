/**
 * jsdom implements no media queries at all, and the theme service asks for one at construction.
 *
 * The stub answers "not dark" and never changes, which is the right default for a component test:
 * the theme's own behaviour is exercised against a query a test drives, in its own suite.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    window.matchMedia = (media: string): MediaQueryList =>
        ({
            matches: false,
            media,
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => true,
        }) as MediaQueryList;
}

/*
 * The select primitive measures its trigger and captures the pointer; jsdom implements neither.
 *
 * Without these a test that opens the sector list dies inside the library rather than in the
 * component, which is a long way to travel to learn that jsdom has no layout engine.
 */
if (typeof Element !== 'undefined' && typeof Element.prototype.hasPointerCapture !== 'function') {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
}

if (typeof globalThis.ResizeObserver !== 'function') {
    globalThis.ResizeObserver = class {
        public observe(): void {
            return undefined;
        }

        public unobserve(): void {
            return undefined;
        }

        public disconnect(): void {
            return undefined;
        }
    };
}

/* jsdom has no layout, so it implements no scrolling either, and an opened row asks to be shown. */
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => undefined;
}
