import {
  IAppInitParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  IGetPaginatedListByPageParams,
  IInsertPaginatedListItemParams,
  ISetParams,
} from './types';

declare module 'lib-cache' {
  export function init(params: IAppInitParams): void;

  export function getOrRefresh<T>(
    params: IGetOrRefreshParams<T>
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
    key: string,
    id: string
  ): Promise<string | 'OK'>;
}
