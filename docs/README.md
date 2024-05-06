<h1 align="center">use-cache</h1>

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

- `redis <Redis>`: Your [`ioredis](https://www.npmjs.com/package/ioredis) instance is the Redis instance that will be used for caching data.
- `maxPaginatedItems <number>`: The total number of items in the paginated list before we begin data eviction.

### getOrRefresh

<a id="getOrRefresh"></a>

```ts
getOrRefresh(options);
```

### getOrRefresh() options

<a id="options"></a>

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
