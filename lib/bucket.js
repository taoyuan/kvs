"use strict";

const async = require('async');

module.exports = exports = Bucket;

function Bucket(namespace, adapter, options) {
  this.namespace = namespace;
  this.adapter = adapter;
  this._load = options.load;
  this._loading = {};
  this._allowStale = options.stale;
  this._delimiter = options.delimiter || ':';
}

Bucket.prototype.getKey = function (key) {
  if (!this.namespace) return key;
  return this.namespace + this._delimiter + key;
};

Bucket.prototype.has =
  Bucket.prototype.exists = function (key, cb) {
    this.adapter.exists(this.getKey(key), cb);
    return this;
  };

Bucket.prototype.get = function (key, data, cb) {
  if (typeof data === 'function') {
    cb = data;
    data = key;
  }
  const _key = this.getKey(key);
  if (!this._load) return this.adapter.get(_key, cb);

  const loading = this._loading;
  if (loading[key]) return loading[key].push(cb);

  const self = this;
  async.waterfall([
    function (callback) {
      self.adapter.has(_key, callback);
    },
    function (has, callback) {
      self.adapter.get(_key, function (err, value) {
        if (err) return cb(err);
        if (void 0 !== value && (has || self._allowStale)) {
          return cb(null, value);
        } else {
          loading[key] = [cb];
        }
        return self._load(data, callback);
      });
    },
    function (value, callback) {
      self.adapter.set(_key, value, function (err) {
        callback(err, value);
      });
    }
  ], function (err, value) {
    const cbs = loading[key];
    if (!cbs) return;
    loading[key] = false;
    if (err) value = null;
    cbs.forEach(function (cb) {
      cb(err, value);
    });
  });

  return self;
};

Bucket.prototype.set = function (key, value, cb) {
  this.adapter.set(this.getKey(key), value, cb);
  return this;
};

Bucket.prototype.getset = function (key, value, cb) {
  this.adapter.getset(this.getKey(key), value, cb);
  return this;
};

Bucket.prototype.getdel = function (key, cb) {
  this.adapter.getdel(this.getKey(key), cb);
  return this;
};

Bucket.prototype.del = function (key, cb) {
  this.adapter.del(this.getKey(key), cb);
  return this;
};

Bucket.prototype.keys = function (pattern, cb) {
  if (typeof pattern === 'function') {
    cb = pattern;
    pattern = '*';
  }
  const namespace_len = this.namespace.length + 1;
  this.adapter.keys(this.namespace + ':' + pattern, function (err, keys) {
    if (err) return cb(err, null);
    if (!keys) return cb(null, []);
    if (null == keys) return cb(null, []);
    for (let i = 0, l = keys.length; i < l; i++) {
      keys[i] = keys[i].substr(namespace_len);
    }
    return cb(null, keys);
  });
  return this;
};

Bucket.prototype.clear = function (pattern, cb) {
  if (typeof pattern === 'function') {
    cb = pattern;
    pattern = '*';
  }
  this.adapter.clear(this.namespace + ':' + pattern, cb);
  return this;
};
