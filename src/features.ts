import { LibCacheError } from './errors';
import { store } from './store';
import {
  IAppInitParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  ISetParams,
} from './types';

export const getOrRefresh = async <T>(
  params: IGetOrRefreshParams<T>
): IGetOrRefreshReturnValue<T> => {
  const { forceRefresh, parseResult, key, expiry, cacheRefreshHandler } = params;
  const redis = store.redis;
  const res = await redis.get(key);

  if (!redis) {
    throw new LibCacheError('Redis instance missing');
  }

  if (
    (!res || forceRefresh) &&
    cacheRefreshHandler &&
    typeof cacheRefreshHandler === 'function'
  ) {
    const val = await cacheRefreshHandler();
    const hasExpiryProvided = typeof expiry === 'number' && expiry > 0;
    const sanitized = typeof val === 'object' ? JSON.stringify(val) : `${val}`;

    await redis.set(
      key,
      sanitized,
      hasExpiryProvided ? 'EX' : undefined,
      hasExpiryProvided ? expiry : undefined
    );

    return val;
  }

  if (typeof res === 'undefined') {
    return undefined;
  }

  if (parseResult) {
    return JSON.parse(res) as T;
  }

  return res as T;
};

export const set = async (params: ISetParams): Promise<string | 'OK'> => {
  try {
    const { key, value, expiry } = params;
    const redis = store.redis;
    const isObject = typeof value === 'object' && !!value;
    const hasExpiryProvided = typeof expiry === 'number' && expiry > 0;

    const res = await redis.set(
      key,
      isObject ? JSON.stringify(isObject) : value,
      hasExpiryProvided ? 'EX' : undefined,
      hasExpiryProvided ? expiry : undefined
    );

    return res;
  } catch (err) {
    const errMessage = err?.message || '';
    return errMessage;
  }
};

export const init = (params: IAppInitParams) => {
  store.redis = params.redis;
};
