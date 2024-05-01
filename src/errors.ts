export class LibCacheError extends Error {
  message: string;

  constructor(message?: string, opts?: ErrorOptions) {
    const sanitized = `LibCacheError:${message}`;

    super(sanitized, opts);
    this.message = `LibCacheError${message}`;
    this.name = 'LibCacheError';
  }
}
