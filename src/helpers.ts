import { UseCacheError } from './errors';
import { store } from './store';

export const checkRedis = (): boolean => {
  if (!store?.redis && !store?.upstashRedis) {
    throw new UseCacheError('Missing redis instance');
  }

  return true;
};
