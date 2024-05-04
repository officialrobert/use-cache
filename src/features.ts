import { LibCacheError } from './errors';
import { store } from './store';
import {
  IAppInitParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  IGetPaginatedListByPageParams,
  ISetParams,
} from './types';

/**
 * Get latest cache data or force refresh before returning the value
 * @param params
 * @returns
 */
export const getOrRefresh = async <T>(
  params: IGetOrRefreshParams<T>
): IGetOrRefreshReturnValue<T> => {
  const { forceRefresh, parseResult, key, expiry, cacheRefreshHandler } =
    params;
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

/**
 * Set redis cache
 * @param params
 * @returns
 */
export const set = async <T>(params: ISetParams<T>): Promise<string | 'OK'> => {
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

/**
 * Required initial function to run from the start of your app
 * @param params
 */
export const init = (params: IAppInitParams): void => {
  store.redis = params.redis;
};

export const getPaginatedListByPage = async <T>(
  params: IGetPaginatedListByPageParams
): Promise<T[]> => {
  return [];
};

export const insertFromPaginatedList = async <T>(
  key: string,
  data: T
): Promise<string | 'OK'> => {
  return 'OK';
};

export const removeItemFromPaginatedList = (key: string, itemId: string) => {};
