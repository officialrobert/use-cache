import { Redis } from 'ioredis';

export interface IGetOrRefreshParams<T> {
  key: string;
  expiry?: number;
  forceRefresh?: boolean;
  parseResult?: boolean;
  cacheRefreshHandler?: () => Promise<T>;

  // if item is part of paginated list
  updateScoreInPaginatedList?: number;
  newScore?: number;
}

export type IGetOrRefreshReturnValue<T> = Promise<T | undefined>;

export interface ISetParams<T> {
  key: string;
  value: string | number | Buffer | Object | Record | T;
  expiry?: number;
}

export interface IAppInitParams {
  redis: Redis;
  maxPaginatedItems: number;
  verbose?: boolean;
}

export interface IAppStoreRef {
  redis: Redis | null;
  maxPaginatedItems: number;
}

export interface IGetPaginatedListByPageParams {
  key: string;
  page: number;
  sizePerPage: number;
}

export interface IInsertPaginatedListItemParams {
  key: string;
  id: string;
  score?: number;
}

export interface IUpdateItemScoreFromPaginatedList {
  key: string;
  id: string;
  score: number;
}
