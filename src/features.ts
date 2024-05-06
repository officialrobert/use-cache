import { LibCacheError } from './errors';
import { store } from './store';
import {
  IAppInitParams,
  IGetOrRefreshDataInPaginatedListParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  IGetPaginatedListByPageParams,
  IInsertPaginatedListItemParams,
  ISetParams,
  IUpdateItemScoreFromPaginatedList,
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
 * Get latest cache data of 'key'.
 * Wraps the `getOrRefresh` function and enables you to update the score of an item in the list.
 * @param params
 * @returns {IGetOrRefreshReturnValue}
 */
export const getOrRefreshDataInPaginatedList = async <T>(
  params: IGetOrRefreshDataInPaginatedListParams<T>
): IGetOrRefreshReturnValue<T> => {
  const { updateScoreInPaginatedList, score, listKey } = params;
  const val = await getOrRefresh(params);
  const id = val && val['id'];

  if (
    typeof val !== 'undefined' &&
    !!val &&
    typeof score === 'number' &&
    score > 0 &&
    typeof id === 'string' &&
    !!id &&
    updateScoreInPaginatedList
  ) {
    // update score in the list for LRU algorithm
    // so you can evict least recently used data
    await updateItemScoreFromPaginatedList({
      id,
      score,
      key: listKey,
    });
  }

  return val;
};

/**
 * Set redis cache.
 * Object data will be sanitzed with JSON.stringify()
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
  store.maxPaginatedItems = params.maxPaginatedItems;

  if (!params?.redis) {
    throw new LibCacheError('Redis instance is missing.');
  }
};

/**
 * Get paginated list by page.
 * Always in ascending order.
 * @param params
 * @returns
 */
export const getPaginatedListByPage = async (
  params: IGetPaginatedListByPageParams
): Promise<string[]> => {
  const { page, sizePerPage, key } = params;
  const start = (page - 1) * sizePerPage;
  const end = start + (sizePerPage - 1);
  const items: { id: string; score: number }[] = [];
  const redis = store.redis;
  const res = await redis.zrevrange(key, start, end, 'WITHSCORES');

  if (res?.length) {
    for (let i = 0; i < res.length; i += 2) {
      const score = parseFloat(res[i + 1]);
      const id = `${res[i] || ''}`;

      if (id?.length > 0 && typeof score === 'number') {
        items.push({ id, score });
      }
    }
  } else {
    return [];
  }

  return items
    .filter((item) => !!item && item?.id?.length > 0)
    .sort((a, b) => {
      const scoreA = a.score ?? -Infinity;
      const scoreB = b.score ?? -Infinity;

      return scoreB - scoreA;
    })
    .map((item) => item?.id);
};

/**
 * Fetch total items in a list
 * @param key
 * @returns
 */
export const getPaginatedListTotalItems = async (
  key: string
): Promise<number> => {
  const redis = store.redis;
  const count = await redis.zcard(key);

  return count;
};

/**
 * Insert an item to the list using the item ID
 * @param params
 * @returns
 */
export const insertToPaginatedList = async (
  params: IInsertPaginatedListItemParams
): Promise<string | 'OK'> => {
  const { score, key, id } = params;
  const total = await getPaginatedListTotalItems(key); // get count
  const maxPaginatedItems = store.maxPaginatedItems;
  const redis = store.redis;
  const scoreToUse = typeof score !== 'number' ? Date.now() : score;

  if (score < 0) {
    throw new LibCacheError('insertToPaginatedList(): Invalid score.');
  }

  // if number of items limit reached
  // evict least recently used data
  if (total >= maxPaginatedItems) {
    await redis.zpopmin(key);
  }

  const response = await redis.zadd(key, scoreToUse, id);

  if (response > 0) {
    return 'OK';
  }

  return 'Error';
};

/**
 * Remove item from the list.
 * @param key
 * @param id
 * @returns
 */
export const removeItemFromPaginatedList = async (
  key: string,
  id: string
): Promise<string | 'OK'> => {
  if (!id) {
    throw new LibCacheError('removeItemFromPaginatedList(): Invalid id.');
  }

  const redis = store.redis;
  const response = await redis.zrem(key, id);

  if (response > 0) {
    return 'OK';
  }

  return 'Error';
};

/**
 * Update the score of an item in the paginated list to move it up or down in the order.
 * @param params 
 * @returns 
 */
export const updateItemScoreFromPaginatedList = async (
  params: IUpdateItemScoreFromPaginatedList
): Promise<string | 'OK'> => {
  const { score, id, key } = params;

  if (!id) {
    throw new LibCacheError('updateItemScoreFromPaginatedList(): Invalid id.');
  }

  const redis = store.redis;
  const response = await redis.zadd(key, score, id);

  if (response > 0) {
    return 'OK';
  }

  return 'Error';
};

/**
 * Generate a string key for your cache based on the formatted filter properties of your database query.
 * {"limit" : 1 , "team" : "team-id" } => "limitTeam"
 * @param filters
 * @returns
 */
export const generateKeyFromQueryFilters = (
  filters: Record<string, any>
): string => {
  if (typeof filters === 'object' && filters) {
    let result = '';

    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        result += `${key.charAt(0).toUpperCase() + key.slice(1)}`;
      }
    }

    return result;
  }

  return '';
};
