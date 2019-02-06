const PromiseA = require('bluebird');
const kvs = require('..');

const TTL = 2;
const redisStore = kvs.store('redis', {db: 1});

(async () => {
  const redisBucket = await redisStore.createBucket({ttl: TTL/*seconds*/});
  // const memoryBucket = await memoryStore.createBucket({max: 100, ttl: 10/*seconds*/});

  await redisBucket.set('foo', 'bar');
  let result = await redisBucket.get('foo');
  console.log(result);
  await redisBucket.del('foo');

  const userId = 123;
  const key = '#' + userId; // for test if key is not the parameter (user_id) to load.

  // Using namespace "user"
  const redisLoadBucket = await redisStore.createBucket('user', {
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

  await redisStore.close();
})();

async function loadUser(id) {
  await PromiseA.fromCallback(cb => setTimeout(cb, 100));
  console.log("Returning user from slow database.");
  return {id: id, name: 'Bob'};
}
