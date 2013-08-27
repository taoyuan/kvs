var LRU = require("lru-cache");

exports.initialize = function initializeMemory(store, callback) {
    store.adapter = {
        crateBucket: function (options) {
            return new Memory(options);
        }
    };
    process.nextTick(callback);
};

function Memory(options) {
    options = options || {};
    this.name = 'memory';
    this.bucket = LRU({
        max: options.max || 500,
        maxAge: options.ttl ? options.ttl * 1000 : null
    });
}

Memory.prototype.has = function (key, cb) {
    cb(null, this.bucket.has(key));
    return this;
};

Memory.prototype.get = function (key, cb) {
    cb(null, this.bucket.get(key));
    return this;
};

Memory.prototype.set = function (key, value, cb) {
    this.bucket.set(key, value);
    if (cb) cb(null, value);
    return this;
};

Memory.prototype.getset = function (key, value, cb) {
    if (typeof value === 'function') {
        cb = value;
        value = null;
    }
    var result = this.bucket.get(key);
    this.bucket.set(key, value);
    cb(null, result);
    return this;
};

Memory.prototype.getdel = function (key, cb) {
    var result = this.bucket.get(key);
    this.bucket.del(key);
    cb(null, result);
    return this;
};

Memory.prototype.del = function (key, cb) {
    this.bucket.del(key);
    if (cb) cb();
    return this;
};

Memory.prototype.keys = function (pattern, cb) {
    if (typeof pattern === 'function') {
        cb = pattern;
    }
    cb(null, this.bucket.keys());
    return this;
};

Memory.prototype.clear = function (pattern, cb) {
    if (typeof pattern === 'function') {
        cb = pattern;
    }
    var del_count = this.bucket.itemCount;
    this.bucket.reset();
    cb(null, del_count);
};
