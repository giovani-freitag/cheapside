export interface WordmarkProps {
    /** Height of the mark in pixels; the wordmark sets itself from the surrounding type. */
    size?: number;
}

/**
 * The mark: four towers, with the one the screen picked lit.
 *
 * A skyline is the rare silhouette that reads as companies and as a sorted bar chart at once,
 * which is the entire product in one glyph — a market of listed firms, and one of them at the top
 * of the ranking. The dimmed towers are the market the lit one came out of, so the mark says
 * "chosen from many" without a caption. Four bars survive being sixteen pixels wide in a tab.
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
                <g fill="currentColor">
                    <rect x="1.9" y="12.4" width="4" height="8.6" rx="0.7" opacity="0.35" />
                    <rect x="7.3" y="7.6" width="4" height="13.4" rx="0.7" opacity="0.35" />
                    <rect x="12.7" y="3.4" width="4" height="17.6" rx="0.7" />
                    <rect x="18.1" y="10" width="4" height="11" rx="0.7" opacity="0.35" />
                </g>
            </svg>
            <span className="wordmark__text">Cheapside</span>
        </span>
    );
}
