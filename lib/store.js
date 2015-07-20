var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var Bucket = require('./bucket');

var existsSync = fs.existsSync || path.existsSync;

module.exports = exports = Store;

function Store(name, settings) {

    if (!(this instanceof Store)) return new Store(name, settings);

    EventEmitter.call(this);

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
    var adapter;
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

    var that = this;
    adapter.initialize(this, function () {
        that.initialized = true;
        that.emit('ready');
    });

    that.ready = function (cb) {
        if (that.initialized) return cb();
        that.on('ready', function () {
            cb();
        });
    };

    return this;
}

require('util').inherits(Store, EventEmitter);

Store.prototype.bucketOptions = function (namespace) {
    var bucketOptions = {};
    if (this.settings && this.settings.buckets) {
        bucketOptions = this.settings.buckets[namespace] || {};
    }
    return _.assign({}, this.defaultBucketOptions, bucketOptions);
};

Store.prototype.createBucket = function (namespace, options) {
    if (typeof namespace === 'object') {
        options = namespace;
        namespace = null;
    }
    namespace = namespace || this.defaultNamespace;
    options = options || this.bucketOptions(namespace);
    return new Bucket(namespace, this.adapter.createBucket(options), options);
};

Store.prototype.bucket = function (namespace) {
    namespace = namespace || this.defaultNamespace;
    var c = this.buckets[namespace];
    if (!c) {
        c = this.createBucket(namespace);
        this.buckets[namespace] = c;
    }
    return c;
};

/**
 * Close store connection
 */
Store.prototype.close = function close(cb) {
    if (typeof this.adapter.close === 'function') {
        this.adapter.close(cb);
    } else if (cb) {
        cb();
    }
};