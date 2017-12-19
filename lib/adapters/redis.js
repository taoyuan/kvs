const redis = require('redis');
const _ = require('lodash');

const defaultPort = 6379;
const defaultHost = 'localhost';

const defaultPacker = {
  pack: function (target) {
    return JSON.stringify(target);
  },
  unpack: function (target) {
    return JSON.parse(target);
  }
};

// settings ref: https://www.npmjs.com/package/redis
exports.initialize = function initializeRedis(store, callback) {
  const settings = store.settings || {};
  let packer = defaultPacker;
  let client;
  if (settings instanceof redis.RedisClient) {
    client = settings;
    process.nextTick(done);
  } else {
    if (settings.client instanceof redis.RedisClient) {
      client = settings.client;
    } else {
      settings.port = settings.port || defaultPort;
      settings.host = settings.host || defaultHost;
      client = redis.createClient(settings.port, settings.host, settings);
      client.on('connect', function () {
        const db = settings.database || settings.db;
        if (db) {
          client.select(db, done);
        } else {
          done();
        }
      });

    }

    if (settings.packer) packer = settings.packer;

  }

  store.client = client;
  store.adapter = {
    createBucket: function (options) {
      return new Redis(client, packer, options);
    },
    close: function (cb) {
      client.end(true);
      cb();
    }
  };

  function done() {
    if (callback) callback();
  }

};

function Redis(client, packer, options) {
  options = options || {};
  this.name = 'redis';
  this.client = client;
  this.packer = packer;
  this.ttl = options.ttl;
  this.type = options.type;

  this.isHash = _.includes(['hash', 'map', 'object'], this.type);
}

Redis.prototype.get = function (key, cb) {
  if (this.isHash) {
    this.client.hgetall(key, cb);
  } else {
    const packer = this.packer;
    this.client.get(key, function (err, result) {
      cb(err, packer.unpack(result));
    });
  }
  return this;
};

Redis.prototype.set = function (key, value, cb) {
  if (this.isHash) {
    cb = cb || function () {
      };
    this.client.hmset(key, value, cb);
  } else {
    if (this.ttl) {
      this.client.setex(key, this.ttl, this.packer.pack(value), cb);
    } else {
      this.client.set(key, this.packer.pack(value), cb);
    }
  }
  return this;
};

Redis.prototype.getset = function (key, value, cb) {
  const self = this;
  if (this.isHash) {
    this.get(key, function (err, result) {
      self.set(key, value, function (err) {
        cb(err, result);
      });
    });
  } else {
    const packer = this.packer;
    this.client.getset(key, packer.pack(value), function (err, result) {
      cb(err, packer.unpack(result));
    });
  }
  return this;
};

Redis.prototype.getdel = function (key, cb) {
  const self = this;
  this.get(key, function (err, value) {
    self.del(key, function (err) {
      cb(err, value);
    });
  });
  return this;
};

Redis.prototype.has = function (key, cb) {
  this.client.exists(key, cb);
  return this;
};

Redis.prototype.del = function (key, cb) {
  this.client.del(key, cb);
  return this;
};

/**
 * Get all bucket keys matching the pattern.
 *
 * @param {string|Function} pattern (optional - default is *)
 * @param {Function} callback
 * @api public
 */

Redis.prototype.keys = function (pattern, callback) {
  if (typeof pattern === 'function') {
    callback = pattern;
    pattern = '*';
  }
  this.client.keys(pattern, function (err, keys) {
    if (err) return callback(err, null);
    if (!keys) return callback(null, []);
    return callback(null, keys);
  });
};

/**
 * Flush all bucket keys matching the pattern.
 *
 * @param {string|Function} pattern (optional - default is *)
 * @param {Function} callback (optional)
 * @api public
 */

Redis.prototype.clear = function (pattern, callback) {
  callback = callback || function () {
    };
  if (typeof pattern === 'function') {
    callback = pattern;
    pattern = '*';
  }
  const self = this;
  this.keys(pattern, function (err, keys) {
    if (err) return callback(err, null);
    if (!keys) return callback(err, []);
    let error = false, remaining = keys.length, del_count = 0;
    if (remaining === 0) return callback(err, 0);
    return keys.forEach(function (key) {
      self.client.del(key, function (err) {
        if (error) {
          return null;
        } else if (err) {
          error = true;
          return callback(err, null);
        }
        del_count++;
        if (!--remaining) callback(err, del_count);
        return null;
      });
    });
  });
};

Redis.prototype.close = function (cb) {
  if (this.client.connected) {
    this.client.once('end', cb);
    this.client.quit();
  } else {
    process.nextTick(cb);
  }
};


