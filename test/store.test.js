"use strict";

const assert = require('chai').assert;
const Store = require('..').Store;
require('./support');

describe('Store', function () {

  let bucket;
  let key;
  let value;

  describe("instantiating with adapter name", function () {
    it("should allows to pass in built-in adapter", function (done) {
      bucket = new Store('memory').bucket();
      bucket.set(key, value, function (err) {
        assert.notOk(err);
        bucket.get(key, function (err, result) {
          assert.equal(result, value);
          bucket.clear(done);
        });
      });
    });

    it("should allows to pass in built-in adapter with promise", async function () {
      bucket = new Store('memory').bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      assert.equal(result, value);
      await bucket.clear();
    });
  });

  describe("instantiating with custom adapter", function () {
    it("should allows to pass in a module", function (done) {
      const adapter = require('../lib/adapters/memory');
      bucket = new Store(adapter).bucket();
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
