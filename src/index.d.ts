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

declare module 'use-cache-helper' {
  export function init(params: IAppInitParams): void;

  export function getOrRefresh<T>(
    params: IGetOrRefreshParams<T>
  ): IGetOrRefreshReturnValue<T>;

  export function getOrRefreshDataInPaginatedList<T>(
    params: IGetOrRefreshDataInPaginatedListParams<T>
  ): IGetOrRefreshReturnValue<T>;

  export function set<T>(params: ISetParams<T>): Promise<string | 'OK'>;

  export function getPaginatedListTotalItems(key: string): Promise<number>;

  export function insertToPaginatedList(
    params: IInsertPaginatedListItemParams
  ): Promise<string | 'OK'>;

  export function getPaginatedListByPage(
    params: IGetPaginatedListByPageParams
  ): Promise<string[]>;

  export function removeItemFromPaginatedList(
    params: IRemoveItemFromPaginatedListParams
  ): Promise<string | 'OK'>;

  export function updateItemScoreFromPaginatedList(
    params: IUpdateItemScoreFromPaginatedList
  ): Promise<string | 'OK'>;

  export function generateKeyFromQueryFilters(
    filters: Record<string, any>
  ): string;

  export function insertRecordsToPaginatedList<T>(
    listKey: string,
    listData: T & { score: number; id: string }[]
  ): Promise<string | 'OK' | 'Error'>;
}
