import { UseCacheError } from './errors';
import { store } from './store';

/**
 * Check both redis(ioredis & upstash) instance reference.
 * Throws an error if neither is present.
 * @returns 
 */
export const checkRedis = (): boolean => {
  if (!store?.redis && !store?.upstashRedis) {
    throw new UseCacheError('Missing redis instance');
  }

  return true;
};
