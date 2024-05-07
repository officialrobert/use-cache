import { getOrRefresh } from 'features';

export const start = async () => {
  interface IUserProfile {
    id: string;
    name: string;
  }
  const id = 'test-user-id';
  const res = await getOrRefresh<IUserProfile>({
    key: 'userProfile' + id,
    async cacheRefreshHandler(): Promise<IUserProfile> {
      return {} as IUserProfile;
    },
  });

  if (res?.id) {
    //
  }
};
