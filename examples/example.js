var kvs = require('kvs');

var redisStore = kvs.store('redis', { db: 1 });
var redisBucket = redisStore.createBucket({ ttl: 100/*seconds*/ });

var memoryStore = kvs.store('memory');
var memoryBucket = memoryStore.createBucket({ max: 100, ttl: 10/*seconds*/ });


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
var key = '#' + user_id; // for test if key is not the parameter (user_id) to load.

// Using namespace "user"
var redisLoadBucket = redisStore.createBucket('user', {
    ttl: 100, /*seconds*/

    // method to load a thing if it's not in the bucket.
    load: function (user_id, cb) {
        // this method will only be called if it's not already in bucket, and will
        // store the result in the bucket store.
        getUser(user_id, cb);
    }
});

// `user_id` is the parameter used to load.
// if no parameter is specified for loading, the `key` will be used.
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