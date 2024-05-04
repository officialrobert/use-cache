import { Redis } from 'ioredis';

export interface IGetOrRefreshParams<T> {
  key: string;
  expiry?: number;
  forceRefresh?: boolean;
  parseResult?: boolean;
  cacheRefreshHandler?: () => Promise<T>;
}

export type IGetOrRefreshReturnValue<T> = Promise<T | undefined>;

export interface ISetParams<T> {
  key: string;
  value: string | number | Buffer | Object | Record | T;
  expiry?: number;
}

export interface IAppInitParams {
  redis: Redis;
  verbose?: boolean;
}

export interface IAppStoreRef {
  redis: Redis | null;
}

export interface IGetPaginatedListByPageParams {
  key: string;
  page: number;
  sizePerPage: number;
}
