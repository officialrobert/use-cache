# lib-cache

`Lib-cache` provides helper functions to easily manage and scale your redis and SQL caching strategies.

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

const getUserById = async (): Promise<IUserProfile> => {
  const { error, data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error?.message || !data) {
    return null;
  }

  return data[0];
};

const verifyUserHandler = async (userId: string) => {
  ////////////////////////////////////////////////
  /////////       Use getOrRefresh        ////////
  ////////////////////////////////////////////////
  const user = await getOrRefresh<GetUserReturn>({
    parseResult: true,
    key: `user:${userId}`,
    cacheRefreshHandler: async (): Promise<GetUserReturn> => {
      return await getUserById(userId);
    },
  });

  if (user?.id) {
    // valid user
  }
};
```

## Setter function

How to manually store cache using the `set` function.

```ts
import { set } from 'lib-cache';

const user = await getUserById(userId);
const res = await set({ key: `user:${userId}`, value: user });

if (res === 'OK') {
  // success
}
```
