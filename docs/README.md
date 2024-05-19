<h1 align="center">use-cache-helper</h1>

### API Reference

<a id="API_Reference"></a>

Full reference to all supported helper functions for caching strategies.

### init

<a id="init"></a>

```ts
init(options);
```

### init() options

<a id="options"></a>

- `redis <Redis>`: Your [**ioredis**](https://www.npmjs.com/package/ioredis) instance is the Redis instance that will be used for caching data.
- `upstashRedis <Redis>` - Your [**Upstash redis**](https://www.npmjs.com/package/@upstash/redis) instance is the Redis instance that will be used for caching data.
- `maxPaginatedItems <number>`: The total number of items in the paginated list before we begin data eviction.

### getOrRefresh

<a id="getOrRefresh"></a>

```ts
getOrRefresh(options);
```

### getOrRefresh() options

<a id="getOrRefresh_options"></a>

- `key <string>` - Your cache key.
- `expiry <number> (optional)` - The expected expiry of your cache in seconds
- `cacheRefreshHandler () => Promise<T> (optional)` - The function callback executes whenever the cache is refreshed.
- `forceRefresh <boolean>` - If set to `true`, refresh the cache data using the `cacheRefreshHandler` parameter function. This function will cache the data returned by calling `cacheRefreshHandler`.
- `parseResult <boolean> (optional)` - If true, serialize and call `JSON.parse()` to the returned data.

### set

<a id="set"></a>

```ts
set(options);
```

### set() options

<a id="set_options"></a>

- `key <string>` - Your cache key
- `value <string | number | Buffer | Object | Record | T>` - Preferably a string value. This function will serialized all object value and turn it into a string.
- `expiry <number> (optional)` - Set a target expiry for the cache data; otherwise, it will persist and occupy memory.

### Paginated List Helpers

<a id="Paginated_List_Helpers"></a>

Paginated lists are usually used for social media app posts, scoreboards, table items, and more.

```ts
const posts = [
  {
    id: 'post-1',
    content: 'Hey!',
  },
  {
    id: 'post-2',
    content: 'How are you?',
  },
];
```

This library uses `Redis Sorted Sets` to implement a paginated list. We store only the unique ID from your data, which is by default sorted by the date added or modified in ascending order. We use the LRU method to evict items from the paginated list.

> Here's how to cache a list based on your SQL query:

```ts
import {
  insertToPaginatedList,
  generateKeyFromQueryFilters,
} from 'use-cache-helper';
import { supabaseClient } from 'lib';
import { map, filter } from 'lodash';

const storeListByPageHandler = async (page: number, sizePerPage: number) => {
  const start = (page - 1) * sizePerPage;
  const end = start + sizePerPage - 1;
  const myTable = 'myTable';
  const currentIsoDate = new Date().toISOString();
  const listResponse = await supabaseClient
    .from(myTable)
    .select('*')
    .not('deleted_at', 'lte', currentIsoDate)
    .order('created_at', { ascending: false })
    .range(start, end)
    .limit(sizePerPage + 1);
  const list = filter(listResponse?.data || [], (item) => !!item?.id);

  const filters = {
    createdAt: 'asc',
  };
  const filtersKey = generateKeyFromQueryFilters(filters); // => generate custom key for your cache considering query filter
  const cacheKey = `myTable:${filtersKey}`;

  await Promise.all(
    map(list, (item) => {
      const id = item?.id;
      const score = new Date(item?.created_at).getTime();

      // Call this function when you plan to update or add a new item to the list
      return insertToPaginatedList({
        id,
        score,
        key: cacheKey,
      });
    })
  );
};
```

### insertRecordsToPaginatedList

<a id="insertRecordsToPaginatedList"></a>

Insert an array of objects containing data into a paginated list. This function also allows you to cache each payload with the appropriate parameters.

```ts
insertRecordsToPaginatedList(options);
```

### insertRecordsToPaginatedList() options

<a id="insertRecordsToPaginatedList_options"></a>

- `listKey <string>` - Your cache key for your paginated list.
- `listData <array>` - Your list data in array form.
- `cacheDataPrefix <string>` - Prefix cache to your data. Example: `users:${id}`
- `cachePayload <boolean>` - If set to true, each payload in the list will be cached
- `cachePayloadExpiry <number>` - Expiry for each payload cache, unit in seconds

### generateKeyFromQueryFilters

<a id="generateKeyFromQueryFilters"></a>

Generate a string key for your cache based on the formatted filter properties of your database query.

```ts
generateKeyFromQueryFilters(filters);
```

### generateKeyFromQueryFilters() filters

<a id="generateKeyFromQueryFilters_filters"></a>

```ts
// {"limit" : 1 , "team" : "team-id" } => "limit1Teamteamid"
```

- `filters Record<string, any>` - A key-value record containing unique filters for your database query.

### getOrRefreshDataInPaginatedList

<a id="getOrRefreshDataInPaginatedList"></a>

```ts
getOrRefreshDataInPaginatedList(options);
```

### getOrRefreshDataInPaginatedList() options

<a id="getOrRefreshDataInPaginatedList_options"></a>

- `key <string>` - Your cache key.
- `listKey <string>` - Your cache key for your paginated list.
- `expiry <number> (optional)` - The expected expiry of your cache in seconds
- `cacheRefreshHandler () => Promise<T> (optional)` - The function callback executes whenever the cache is refreshed.
- `forceRefresh <boolean>` - If set to `true`, refresh the cache data using the `cacheRefreshHandler` parameter function. This function will cache the data returned by calling `cacheRefreshHandler`.
- `parseResult <boolean> (optional)` - If true, serialize and call `JSON.parse()` to the returned data.
- `score <number> (optional)` - The score affects the order of the item in the paginated list. By default, we use `Date.now()` if this value is left blank, as we sort it by date in ascending order.
- `updateScoreInPaginatedList <boolean> (optional)` - Determines whether to update the score of the data in the list that will affect the item's order using the `score` value passed. If you're using the LRU algorithm, most likely you want to update the order when fetching or refreshing the item's payload, causing it to move up in the order list.

### getPaginatedListByPage

<a id="getPaginatedListByPage"></a>

```ts
getPaginatedListByPage(options);
```

### getPaginatedListByPage() options

<a id="getPaginatedListByPage_options"></a>

- `key <string>` - Your cache key for your paginated list.
- `page <number>` - The target page you want to fetch.
- `sizePerPage <number>` - The total items per page.

### insertToPaginatedList

<a id="insertToPaginatedList"></a>

```ts
insertToPaginatedList(options);
```

### insertToPaginatedList() options

<a id="insertToPaginatedList_options"></a>

Take note that when we hit the limit `maxPaginatedItems`, we start evicting data beginning with the least recently used data, which has the lowest score.

- `key <string>` - Your cache key for your paginated list.
- `id <string>` - The 'id' for your data/payload.
- `score <number> (optional)` - The score affects the order of the item in the paginated list. By default, we use `Date.now()` if this value is left blank, as we sort it by date in ascending order.

### getPaginatedListTotalItems

<a id="getPaginatedListTotalItems"></a>

Fetch the total number of items in the list. You can use this value for paginated UI to display the page number and total items.

```ts
getPaginatedListTotalItems(key);
```

### getPaginatedListTotalItems() key

<a id="getPaginatedListTotalItems_key"></a>

- `key <string>` - Your cache key for your paginated list.

### removeItemFromPaginatedList

<a id="removeItemFromPaginatedList"></a>

Remove a target item from the list.

```ts
removeItemFromPaginatedList(options);
```

### removeItemFromPaginatedList() options

<a id="removeItemFromPaginatedList_options"></a>

- `key <string>` - Your cache key for your paginated list.
- `id <string>` - Target 'id' of the item.

### updateItemScoreFromPaginatedList

<a id="updateItemScoreFromPaginatedList"></a>

Update item score in the list. This will affect the order of the item.

```ts
updateItemScoreFromPaginatedList(options);
```

### updateItemScoreFromPaginatedList() options

<a id="updateItemScoreFromPaginatedList_options"></a>

- `key <string>` - Your cache key for your paginated list.
- `id <string>` - Target 'id' of the item.
- `score <number>` - New score.
