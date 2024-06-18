import { store } from 'store';
import { checkRedis } from '../helpers';

/**
 * Check if Redis stack schema for paginated list already exists.
 * @returns {boolean} true or false
 */
export const validateSchemaAlreadyExists = async (
  listKey: string
): Promise<boolean> => {
  checkRedis();

  try {
    const redis = store.redis;

    if (redis) {
      await redis.call('FT.INFO', `${listKey || ''}_idx`);
    } else {
      console.log(
        'UseCacheError: validateSchemaAlreadyExists() is not supported for @upstash/redis instance'
      );

      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Define schema for your paginated list.
 * This allows you to call searchPaginatedListByProperty() and query your paginated data.
 * @param  {string} listKey Your list's cache key
 * @param  {Object} properties
 */
export const createSchemaForSearchableList = (
  listKey: string,
  properties: Record<string, 'string' | 'number'>
) => {
  if (properties && typeof properties === 'object') {
    const keys = Object.keys(properties);

    for (let i = 0; i < keys.length; i++) {
      const property = properties[keys[i]];

      if (property === 'string' || property === 'number') {
        // @todo add schema
      }
    }
  }
};

export const searchPaginatedListByProperty = (
  listKey: string,
  properties: Record<string, string>
) => {
  if (listKey && properties && typeof properties === 'object') {
    // @todo search by property
  }
};
