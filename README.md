# kvs

[![NPM Version](https://img.shields.io/npm/v/kvs.svg?style=flat)](https://www.npmjs.org/package/kvs)
[![Build Status](https://travis-ci.com/taoyuan/kvs.svg?branch=master)](https://travis-ci.com/github/taoyuan/kvs)
[![Coverage percentage](https://coveralls.io/repos/taoyuan/kvs/badge.svg)](https://coveralls.io/r/taoyuan/kvs)

Simple key-value store facade for node.

## Installation

```sh
$ npm install kvs
```

## Methods

```
set(key, val)
get(key)
del(key)
getset(key, value)
getdel(key)
keys()
clear()
```

## Examples

```js
const {Store} = require('..');

const TTL = 100;
const store = Store.create('memory');

(async () => {
  const redisBucket = await store.createBucket({ttl: TTL /*seconds*/});
  // const memoryBucket = await memoryStore.createBucket({max: 100, ttl: 10/*seconds*/});

  await redisBucket.set('foo', 'bar');
  let result = await redisBucket.get('foo');
  console.log(result);
  await redisBucket.del('foo');

  const userId = 123;
  const key = '#' + userId; // for test if key is not the parameter (user_id) to load.

  // Using namespace "user"
  const redisLoadBucket = await store.createBucket('user', {
    ttl: TTL /*seconds*/,

    // method to load a thing if it's not in the bucket.
    load: loadUser,
  });

  // `user_id` is the parameter used to load.
  // if no parameter is specified for loading, the `key` will be used.
  let user = await redisLoadBucket.get(key, userId);
  console.log(user);

  // Second time fetches user from redisLoadBucket
  user = await redisLoadBucket.get(key, userId);
  console.log(user);

  // Outputs:
  // Returning user from slow database.
  // { id: 123, name: 'Bob' }
  // { id: 123, name: 'Bob' }

  await store.close();
})();

async function loadUser(id) {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Returning user from slow database.');
  return {id: id, name: 'Bob'};
}

// Outputs:
// bar
// Returning user from slow database.
// { id: 123, name: 'Bob' }
// { id: 123, name: 'Bob' }
```

## Tests

```bash
$ npm test
```

## License

`kvs` is licensed under the MIT license.
