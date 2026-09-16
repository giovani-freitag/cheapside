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
