import { checkRedis } from './helpers';
import { UseCacheError } from './errors';
import { store } from './store';
import {
  IAppInitParams,
  IGetOrRefreshDataInPaginatedListParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  IGetPaginatedListByPageParams,
  IInsertPaginatedListItemParams,
  IRemoveItemFromPaginatedListParams,
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
  const upstashRedis = store.upstashRedis;

  let res: string | null | undefined = '';

  if (redis) {
    res = await redis.get(key);
  } else if (upstashRedis) {
    res = await upstashRedis.get(key);
  } else {
    checkRedis();
  }

  if (
    (!res || forceRefresh) &&
    cacheRefreshHandler &&
    typeof cacheRefreshHandler === 'function'
  ) {
    const val = await cacheRefreshHandler();
    const hasExpiryProvided = typeof expiry === 'number' && expiry > 0;
    const sanitized = typeof val === 'object' ? JSON.stringify(val) : `${val}`;

    if (redis) {
      await redis.set(
        key,
        sanitized,
        hasExpiryProvided ? 'EX' : undefined,
        hasExpiryProvided ? expiry : undefined
      );
    } else if (upstashRedis) {
      await upstashRedis.set(
        key,
        sanitized,
        hasExpiryProvided
          ? {
              ex: expiry,
            }
          : {}
      );
    }

    return val;
  }

  if (typeof res === 'undefined') {
    return undefined;
  }

  if (parseResult && res && typeof res === 'string') {
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
    const upstashRedis = store.upstashRedis;
    const isObject = typeof value === 'object' && !!value;
    const hasExpiryProvided = typeof expiry === 'number' && expiry > 0;

    if (typeof value === 'undefined') {
      throw new UseCacheError('set(): value should not be undefined.');
    }

    checkRedis();

    if (redis) {
      const res = await redis.set(
        key,
        isObject ? JSON.stringify(isObject) : `${value}`,
        hasExpiryProvided ? 'EX' : undefined,
        hasExpiryProvided ? expiry : undefined
      );

      return res;
    } else if (upstashRedis) {
      const res = await upstashRedis.set(
        key,
        isObject ? JSON.stringify(isObject) : `${value}`,
        hasExpiryProvided
          ? {
              ex: expiry,
            }
          : {}
      );

      return res;
    } else {
      throw new UseCacheError('Redis instance missing');
    }
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
  store.upstashRedis = params.upstashRedis;

  if (params?.maxPaginatedItems > 0) {
    store.maxPaginatedItems = params.maxPaginatedItems;
  }

  checkRedis();
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
  const upstashRedis = store.upstashRedis;

  let res: string[] = [];

  checkRedis();

  if (redis) {
    res = await redis.zrevrange(key, start, end, 'WITHSCORES');
  } else if (upstashRedis) {
    res = await upstashRedis.zrange<string[]>(key, start, end, {
      withScores: true,
      rev: true,
    });
  }

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
  const upstashRedis = store.upstashRedis;

  checkRedis();

  if (redis) {
    const count = await redis.zcard(key);

    return count;
  } else {
    const count = await upstashRedis.zcard(key);

    return count;
  }
};

/**
 * Automatically insert ID data from your array of objects.
 * Use non-zero & non-negative scores.
 * @param listKey
 * @param listData
 * @returns {string}
 */
export const insertRecordsToPaginatedList = async <T>(
  listKey: string,
  listData: T & { score: number; id: string }[]
): Promise<string | 'OK'> => {
  checkRedis();

  if (listData?.length > 0) {
    const invalidScores = listData.filter((d) => d.score < 1);

    if (invalidScores?.length > 0) {
      throw new UseCacheError('insertRecordsToPaginatedList() invalid score');
    }

    for (let i = 0; i < listData.length; i++) {
      const payload = listData[i];
      const { id, score } = payload;

      await insertToPaginatedList({
        score,
        id,
        key: listKey,
      });
    }

    return 'OK';
  }

  return 'Error';
};

/**
 * Insert an item to the list using the item ID.
 * Use non-zero & non-negative scores.
 * @param params
 * @returns {string}
 */
export const insertToPaginatedList = async (
  params: IInsertPaginatedListItemParams
): Promise<string | 'OK'> => {
  const { score, key, id } = params;
  const total = await getPaginatedListTotalItems(key); // get count
  const maxPaginatedItems = store.maxPaginatedItems;
  const redis = store.redis;
  const upstashRedis = store.upstashRedis;
  const scoreToUse = typeof score !== 'number' ? Date.now() : score;

  if (score < 0) {
    throw new UseCacheError('insertToPaginatedList(): Invalid score.');
  }

  checkRedis();

  // if number of items limit reached
  // evict least recently used data
  if (total >= maxPaginatedItems && redis) {
    await redis.zpopmin(key);
  } else if (total >= maxPaginatedItems && upstashRedis) {
    await upstashRedis.zpopmin(key);
  }

  if (redis) {
    const response = await redis.zadd(key, scoreToUse, id);
    if (response > 0) {
      return 'OK';
    }
  } else if (upstashRedis) {
    await upstashRedis.zadd(key, { incr: true }, { score, member: id });

    return 'OK';
  }

  return 'Error';
};

/**
 * Remove item from the list.
 * @param params
 * @returns {string}
 */
export const removeItemFromPaginatedList = async (
  params: IRemoveItemFromPaginatedListParams
): Promise<string | 'OK'> => {
  const { id, key } = params;

  if (!id) {
    throw new UseCacheError('removeItemFromPaginatedList(): Invalid id.');
  }

  const redis = store.redis;
  const upstashRedis = store.upstashRedis;

  if (redis) {
    const response = await redis.zrem(key, id);

    if (response > 0) {
      return 'OK';
    }
  } else if (upstashRedis) {
    const response = await upstashRedis.zrem(key, id);

    if (response > 0) {
      return 'OK';
    }
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
    throw new UseCacheError('updateItemScoreFromPaginatedList(): Invalid id.');
  }

  const redis = store.redis;
  const upstashRedis = store.upstashRedis;

  if (redis) {
    const response = await redis.zadd(key, score, id);

    if (response > 0) {
      return 'OK';
    }
  } else if (upstashRedis) {
    await upstashRedis.zadd(key, { incr: true }, { score, member: id });

    return 'OK';
  }

  return 'Error';
};

/**
 * Generate a string key for your cache based on the formatted filter properties of your database query.
 * {"limit" : 1 , "team" : "team-id" } => "limit1Teamteamid"
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
        const val = `${filters[key] || ''}`;

        result += `${key.charAt(0).toUpperCase() + key.slice(1)}${
          val ? val.charAt(0).toUpperCase() + val.slice(1) : ''
        }`;
      }
    }

    return result;
  }

  return '';
};
