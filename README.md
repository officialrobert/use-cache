# lib-cache

`Lib-cache` provides helper functions to easily manage and scale your db cache.

## Initialize

```ts
import { init } from 'lib-cache';
import { redis } from 'lib';

// your ioredis instance
init({ redis: redis });
```

## Getter function

Use `getOrRefresh` with `SupabaseDB`

```ts
import { getOrRefresh } from 'lib-cache';
import { supabaseClient } from 'lib';

interface IUserProfile {
  id: string;
  name: string;
  email: string;
}

type GetUserReturn = IUserProfile | null;

const verifyUserHandler = async (userId: string) => {
  const user = await getOrRefresh<GetUserReturn>({
    parseResult: true,
    key: `user:${userId}`,
    cacheRefreshHandler: async (): Promise<GetUserReturn> => {
      const { error, data } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (error?.message || !data) {
        return null;
      }

      return data[0];
    },
  });

  if (user?.id) {
    // valid user
  }
};
```
