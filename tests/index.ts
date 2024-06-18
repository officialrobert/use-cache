import 'dotenv/config';
import { init, getOrRefresh } from '../src/features';
import { Redis } from '@upstash/redis';

interface IUserProfile {
  id: string;
  name: string;
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const start = async () => {
  await testGetOrRefresh();
};

const testGetOrRefresh = async () => {
  const id = 'test-user-id';
  const res = await getOrRefresh<IUserProfile>({
    key: 'userProfile' + id,
    async cacheRefreshHandler(): Promise<IUserProfile> {
      return {
        id,
        name: 'TestUserProfile',
      } as IUserProfile;
    },
  });

  if (res?.id) {
    console.log('getOrRefresh', res);
  }
};

init({ upstashRedis: redis, maxPaginatedItems: 100 });
