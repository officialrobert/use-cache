# use-cache-helper

`use-cache-helper` provides helper functions to easily manage and scale your redis and database caching strategies.

## Initialize

```ts
import { init } from 'use-cache-helper';
import { redis } from 'lib';

// your ioredis instance
init({ redis: redis });
```

> Here's how to set the maximum number of items in the paginated list before we begin data eviction.

```ts
init({ redis: redis, maxPaginatedItems: 200 });
```

## Getter function

Use `getOrRefresh` with `SupabaseDB`

> Declare query function

```ts
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
```

```ts
import { getOrRefresh } from 'use-cache-helper';

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
import { set } from 'use-cache-helper';

const user = await getUserById(userId);
const res = await set({ key: `user:${userId}`, value: user });

if (res === 'OK') {
  // success
}
```

## Strategies for paginated list

This library uses `Redis Sorted Sets` to implement a paginated list. We store only the unique ID from your data, which is by default sorted by the date added or modified in ascending order. We use the LRU method to evict items from the paginated list.

You can configure the maximum number of items in the paginated list. When this limit is reached, it kicks out the least recently used data, determined by score.

```ts
// 200 items limit by default
init({ redis: redis, maxPaginatedItems: 200 });
```

> Inserting data

```ts
import { insertToPaginatedList } from 'use-cache-helper';

const handleInsertItem = async (id: string) => {
  await insertToPaginatedList({
    id,
    key: 'myPaginatedList',
    // The 'score' field is optional; if not provided, it uses the Date.now() value.
    score: Date.now(),
  });
};
```

## Documentation

See full API reference <a href="./docs/README.md"><b>Documentation</b></a>

## License

Licensed under [MIT](./LICENSE).
