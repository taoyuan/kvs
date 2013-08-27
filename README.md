kvs
============

Simple key-value store facade for node.

## Installation
	npm install kvs
	
## Methods
    set(key, val, cb)
    get(key, cb)
    del(key, cb)
    getset(key, value, cb)
    getdel(key, cb)
    keys(cb)
    clear(cb)

## Examples
```js
var kvs = require('kvs');

var redisStore = kvs.store('redis', { db: 1 });
var redisBucket = redisStore.crateBucket({ ttl: 100/*seconds*/ });

var memoryStore = kvs.store('memory');
var memoryBucket = memoryStore.crateBucket({ max: 100, ttl: 10/*seconds*/ });


redisBucket.set('foo', 'bar', function(err) {
    if (err) { throw err; }

    redisBucket.get('foo', function(err, result) {
        console.log(result);
        // >> 'bar'
        redisBucket.del('foo', function(err) {});
    });
});

function getUser(id, cb) {
    setTimeout(function () {
        console.log("Returning user from slow database.");
        cb(null, {id: id, name: 'Bob'});
    }, 100);
}

var user_id = 123;
var key = '#' + user_id; // for test if key is not the data (user_id) to load.

// Using namespace "user"
var redisLoadBucket = redisStore.crateBucket('user', {
    ttl: 100, /*seconds*/

    // method to load a thing if it's not in the bucket.
    load: function (user_id, cb) {
        // this method will only be called if it's not already in bucket, and will
        // bucket the result in the bucket store.
        getUser(user_id, cb);
    }
});

// `user_id` is used to load, or use `key` without `user_id` parameter.
redisLoadBucket.get(key, user_id, function (err, user) {
    console.log(user);

    // Second time fetches user from redisLoadBucket
    redisLoadBucket.get(key, user_id, function (err, user) {
        console.log(user);
    });
});

// Outputs:
// Returning user from slow database.
// { id: 123, name: 'Bob' }
// { id: 123, name: 'Bob' }
```


## Tests
	npm test

## License

`kvs` is licensed under the MIT license.