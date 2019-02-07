const kvs = require('..');

const TTL = 100;
const store = kvs.store('memory');

(async () => {
  const redisBucket = await store.createBucket({ttl: TTL/*seconds*/});
  // const memoryBucket = await memoryStore.createBucket({max: 100, ttl: 10/*seconds*/});

  await redisBucket.set('foo', 'bar');
  let result = await redisBucket.get('foo');
  console.log(result);
  await redisBucket.del('foo');

  const userId = 123;
  const key = '#' + userId; // for test if key is not the parameter (user_id) to load.

  // Using namespace "user"
  const redisLoadBucket = await store.createBucket('user', {
    ttl: TTL, /*seconds*/

    // method to load a thing if it's not in the bucket.
    load: loadUser
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
  console.log("Returning user from slow database.");
  return {id: id, name: 'Bob'};
}
