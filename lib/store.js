const path = require('path');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const Bucket = require('./bucket');
const utils = require('./utils');

const existsSync = fs.existsSync || path.existsSync;

class Store extends EventEmitter {
  constructor(name, settings) {
    super();

    this.name = name;
    this.settings = settings;

    this.defaultBucketOptions = {
      ttl: 0
    };
    this.defaultNamespace = 'bucket';
    this.buckets = {};

    // and initialize store using adapter
    // this is only one initialization entry point of adapter
    // this module should define `adapter` member of `this` (store)
    let adapter;
    if (typeof name === 'object') {
      adapter = name;
      this.name = adapter.name;
    } else if (name.match(/^\//)) {
      // try absolute path
      adapter = require(name);
    } else if (existsSync(__dirname + '/adapters/' + name + '.js')) {
      // try built-in adapter
      adapter = require('./adapters/' + name);
    } else {
      // try foreign adapter
      try {
        adapter = require('kvs-' + name);
      } catch (e) {
        return console.log('\nWARNING: KVS adapter "' + name + '" is not installed,\nso your models would not work, to fix run:\n\n    npm install kvs-' + name, '\n');
      }
    }

    const that = this;
    adapter.initialize(this, () => {
      this.initialized = true;
      this.emit('ready');
    });

    that.ready = (cb) => {
      if (this.initialized) return cb();
      this.on('ready', () => cb());
    };
  }


  bucketOptions(namespace) {
    let bucketOptions = {};
    if (this.settings && this.settings.buckets) {
      bucketOptions = this.settings.buckets[namespace] || {};
    }
    return Object.assign({}, this.defaultBucketOptions, bucketOptions);
  };

  createBucket(namespace, options) {
    if (typeof namespace === 'object') {
      options = namespace;
      namespace = null;
    }
    namespace = namespace || this.defaultNamespace;
    options = options || this.bucketOptions(namespace);
    return new Bucket(namespace, this.adapter.createBucket(options), options);
  };

  bucket(namespace) {
    namespace = namespace || this.defaultNamespace;
    if (!this.buckets[namespace]) {
      this.buckets[namespace] = this.createBucket(namespace);
    }
    return this.buckets[namespace];
  };

  /**
   * Close store connection
   */
  close(cb) {
    cb = cb || utils.createPromiseCallback();
    if (typeof this.adapter.close === 'function') {
      this.adapter.close(cb);
    } else if (cb) {
      cb();
    }
    return cb.promise;
  };

}

module.exports = exports = Store;
