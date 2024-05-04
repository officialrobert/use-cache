import {
  IAppInitParams,
  IGetOrRefreshParams,
  IGetOrRefreshReturnValue,
  ISetParams,
} from './types';

declare module 'lib-cache' {
  export function init(params: IAppInitParams): void;

  export function getOrRefresh<T>(
    params: IGetOrRefreshParams<T>
  ): IGetOrRefreshReturnValue<T>;

  export function set<T>(params: ISetParams<T>): Promise<string | 'OK'>;
}
