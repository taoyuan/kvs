"use strict";

const PromiseA = require('bluebird');
const utils = require('./utils');

class Bucket {
  constructor(namespace, adapter, options) {
    this.namespace = namespace;
    this.adapter = adapter;
    this._load = options.load;
    this._loading = {};
    this._allowStale = options.stale;
    this._delimiter = options.delimiter || ':';
  }


  getKey(key) {
    if (!this.namespace) return key;
    return this.namespace + this._delimiter + key;
  };

  has(...args) {
    return this.exists(...args);
  }

  exists(key, cb) {
    cb = cb || utils.createPromiseCallback();
    this.adapter.exists(this.getKey(key), cb);
    return cb.promise;
  };

  get(key, query, cb) {
    if (typeof query === 'function') {
      cb = query;
      query = key;
    }
    cb = cb || utils.createPromiseCallback();
    const _key = this.getKey(key);
    if (!this._load) {
      this.adapter.get(_key, cb);
      return cb.promise;
    }

    PromiseA.fromCallback(cb => this.adapter.has(_key, cb)).then(async exists => {
      let value = await PromiseA.fromCallback(cb => this.adapter.get(_key, cb));
      if (value !== void 0 && (exists || this._allowStale)) {
        return value;
      }
      if (this._load.length <= 1) {
        value = await this._load(query);
      } else {
        value = await PromiseA.fromCallback(cb => this._load(query, cb));
      }

      return PromiseA.fromCallback(cb => this.adapter.set(_key, value, cb)).thenReturn(value);
    }).asCallback(cb);

    return cb.promise;
  };

  set(key, value, cb) {
    cb = cb || utils.createPromiseCallback();
    this.adapter.set(this.getKey(key), value, cb);
    return cb.promise;
  };

  getset(key, value, cb) {
    cb = cb || utils.createPromiseCallback();
    this.adapter.getset(this.getKey(key), value, cb);
    return cb.promise;
  };

  getdel(key, cb) {
    cb = cb || utils.createPromiseCallback();
    this.adapter.getdel(this.getKey(key), cb);
    return cb.promise;
  };

  del(key, cb) {
    cb = cb || utils.createPromiseCallback();
    this.adapter.del(this.getKey(key), cb);
    return cb.promise;
  };

  keys(pattern, cb) {
    if (typeof pattern === 'function') {
      cb = pattern;
      pattern = null;
    }
    pattern = pattern || '*';
    cb = cb || utils.createPromiseCallback();
    const namespace_len = this.namespace.length + 1;
    PromiseA.fromCallback(cb => this.adapter.keys(this.namespace + ':' + pattern, function (err, keys) {
      if (err) return cb(err, null);
      if (!keys) return cb(null, []);
      if (null == keys) return cb(null, []);
      for (let i = 0, l = keys.length; i < l; i++) {
        keys[i] = keys[i].substr(namespace_len);
      }
      return cb(null, keys);
    })).asCallback(cb);

    return cb.promise;
  };

  clear(pattern, cb) {
    if (typeof pattern === 'function') {
      cb = pattern;
      pattern = null;
    }
    pattern = pattern || '*';
    cb = cb || utils.createPromiseCallback();
    this.adapter.clear(this.namespace + ':' + pattern, cb);
    return cb.promise;
  };

}

module.exports = exports = Bucket;

