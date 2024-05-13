export class UseCacheError extends Error {
  message: string;

  constructor(message?: string, opts?: ErrorOptions) {
    const sanitized = `UseCacheError:${message}`;

    super(sanitized, opts);
    this.message = `UseCacheError${message}`;
    this.name = 'UseCacheError';
  }
}
