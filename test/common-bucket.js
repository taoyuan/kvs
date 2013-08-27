"use strict";

var chai = require('chai');
chai.Assertion.includeStack = true;
var assert = chai.assert;
var support = require('./support');
var async = require('async');
var _ = require('lodash');

module.exports = function (getStore) {
    var types = {
        string: {
            genValue: function () {
                return support.random.string();
            },
            options: {}
        },
        hash: {
            genValue: function () {
                return { name: support.random.string() };
            },
            options: {type: 'hash'}
        }
    };

    _.forOwn(types, function (type, name) {
        testKvs(name, type.genValue, type.options);
    });

    function testKvs(name, genValue, options) {

        context('bucket ' + name, function () {
            var store;
            var bucket;
            var key;
            var value;

            beforeEach(function () {
                store = getStore();
                bucket = store.createBucket(support.random.string(), options);
                key = support.random.string(20);
                value = genValue();
            });

            afterEach(function (done) {
                bucket.clear(function () {
                    store.close(done);
                });
            });

            describe('get() and set()', function () {

                it("should set and get data in bucket", function (done) {
                    bucket.set(key, value, function (err) {
                        assert.notOk(err);
                        bucket.get(key, function (err, result) {
                            assert.deepEqual(result, value);
                            done();
                        });
                    });
                });

                it("should set data without a callback", function (done) {
                    bucket.set(key, value);
                    setTimeout(function () {
                        bucket.get(key, function (err, result) {
                            assert.deepEqual(result, value);
                            done();
                        });
                    }, 20);
                });
            });

            describe("del()", function () {

                beforeEach(function (done) {
                    bucket.set(key, value, function (err) {
                        assert.notOk(err);
                        done();
                    });
                });

                it("should delete data from bucket", function (done) {
                    bucket.get(key, function (err, result) {
                        assert.deepEqual(result, value);

                        bucket.del(key, function (err) {
                            assert.notOk(err);

                            bucket.get(key, function (err, result) {
                                assert.notOk(result);
                                done();
                            });
                        });
                    });
                });

                it("should delete data without a callback", function (done) {
                    bucket.get(key, function (err, result) {
                        assert.deepEqual(result, value);

                        bucket.del(key);

                        setTimeout(function () {
                            bucket.get(key, function (err, result) {
                                assert.notOk(result);
                                done();
                            });
                        }, 20);
                    });
                });
            });

            it('getset()', function (done) {
                bucket.set(key, value, function (err) {
                    assert.notOk(err);
                    var newValue = genValue();
                    bucket.getset(key, newValue, function (err, result) {
                        assert.deepEqual(value, result);
                        bucket.get(key, function (err, result) {
                            assert.deepEqual(newValue, result);
                            done();
                        });
                    });
                });
            });

            it('getdel()', function (done) {
                bucket.set(key, value, function (err) {
                    assert.notOk(err);
                    bucket.getdel(key, function (err, result) {
                        assert.deepEqual(value, result);
                        bucket.get(key, function (err, result) {
                            assert.notOk(result);
                            done();
                        });
                    });
                });
            });

            it('keys()', function (done) {
                var _keys = [];
                for (var i = 0; i < 10; i++) {
                    _keys.push(support.random.string());
                }
                async.eachSeries(_keys, function (key, callback) {
                    bucket.set(key, genValue(), callback);
                }, function () {
                    bucket.keys(function (err, keys) {
                        assert.sameMembers(_keys, keys);
                        done();
                    });
                });
            });

            it('clear()', function (done) {
                async.series([
                    bucket.set.bind(bucket, 'key1', value),
                    bucket.set.bind(bucket, 'key2', value),
                    function (callback) {
                        bucket.get('key1', function (err, val) {
                            assert.ok(val);
                            callback();
                        });
                    },
                    function (callback) {
                        bucket.get('key2', function (err, val) {
                            assert.ok(val);
                            callback();
                        });
                    },
                    bucket.clear.bind(bucket),
                    function (callback) {
                        bucket.get('key1', function (err, val) {
                            assert.notOk(val);
                            callback();
                        });
                    },
                    function (callback) {
                        bucket.get('key2', function (err, val) {
                            assert.notOk(val);
                            callback();
                        });
                    }
                ], done);
            });
        });
    }

};