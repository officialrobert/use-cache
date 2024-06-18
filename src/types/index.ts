import { Redis } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

export interface IGetOrRefreshParams<T> {
  key: string;
  expiry?: number;
  forceRefresh?: boolean;
  parseResult?: boolean;
  cacheRefreshHandler?: () => Promise<T>;
}

export type IGetOrRefreshDataInPaginatedListParams<T> =
  IGetOrRefreshParams<T> & {
    // if item is part of paginated list
    id: string;
    listKey: string;
    updateScoreInPaginatedList?: number;
    key?: string;
    score?: number;
  };

export type IGetOrRefreshReturnValue<T> = Promise<T | undefined | null>;

export interface ISetParams<T> {
  key: string;
  value: string | number | Buffer | Object | Record<string, string | T> | T;
  expiry?: number;
}

export interface IAppInitParams {
  maxPaginatedItems?: number;
  redis?: Redis;
  upstashRedis?: UpstashRedis;
  verbose?: boolean;
}

export interface IAppStoreRef {
  redis: Redis | null;
  maxPaginatedItems: number;
  upstashRedis: UpstashRedis | null;
}

export interface IGetPaginatedListByPageParams {
  listKey: string;
  page: number;
  sizePerPage: number;
  ascendingOrder?: boolean;
}

export interface IInsertPaginatedListItemParams {
  listKey: string;
  id: string;
  score?: number;
}

export interface IRemoveItemFromPaginatedListParams {
  listKey: string;
  id: string;
}

export interface IUpdateItemScoreFromPaginatedList {
  listKey: string;
  id: string;
  score: number;
}
