export interface WordmarkProps {
    /** Height of the mark in pixels; the wordmark sets itself from the surrounding type. */
    size?: number;
}

/**
 * The mark: a fraction, drawn as what the screen is looking for.
 *
 * A short bar over a long one — a small price above large earnings, which is a low multiple and
 * the whole thesis in one glyph. It is also just a division sign, which is all the project does.
 * Four rectangles survive being sixteen pixels wide in a browser tab.
 */
export function Wordmark({ size = 32 }: WordmarkProps) {
    return (
        <span className="wordmark">
            <svg
                className="wordmark__mark"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
            >
                <rect x="2" y="3" width="7.5" height="5.4" rx="0.6" fill="currentColor" />
                <rect x="2" y="11.1" width="20" height="1.5" rx="0.6" fill="currentColor" />
                <rect x="2" y="15.2" width="20" height="5.4" rx="0.6" fill="currentColor" />
            </svg>
            <span className="wordmark__text">Cheapside</span>
        </span>
    );
}
