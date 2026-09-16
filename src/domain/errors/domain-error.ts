/** Raised when the screen is handed something it cannot rank, rather than ranking it wrongly. */
export class DomainError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'DomainError';
    }
}
