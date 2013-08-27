"use strict";

var assert = require('chai').assert;
var Store = require('../').Store;
require('./support');

describe('Store', function () {

    var bucket;
    var key;
    var value;

    describe("instantiating with adapter name", function () {
        it("should allows to pass in built-in adapter", function (done) {
            bucket = Store('memory').bucket();
            bucket.set(key, value, function (err) {
                assert.notOk(err);
                bucket.get(key, function (err, result) {
                    assert.equal(result, value);
                    bucket.clear(done);
                });
            });
        });
    });

    describe("instantiating with custom adapter", function () {
        it("should allows to pass in a module", function (done) {
            var adapter = require('../lib/adapters/memory');
            bucket = Store(adapter).bucket();
            bucket.set(key, value, function (err) {
                assert.notOk(err);
                bucket.get(key, function (err, result) {
                    assert.equal(result, value);
                    bucket.clear(done);
                });
            });
        });
    });
});