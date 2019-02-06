"use strict";

import { assert } from "chai";
import _ = require("lodash");
import { random, StoreProvider } from "./support";
import { Bucket } from "../src";

module.exports = function(getStore: StoreProvider) {
  const types = {
    string: {
      genValue: function() {
        return random.string();
      },
      options: {}
    },
    hash: {
      genValue: function() {
        return { name: random.string() };
      },
      options: { type: "hash" }
    }
  };

  _.forOwn(types, (type, name) => testKVS(name, type.genValue, type.options));

  function testKVS(name, genValue, options) {

    context("bucket " + name, function() {
      let store;
      let bucket: Bucket;
      let key;
      let value;

      beforeEach(async () => {
        store = await getStore();
        bucket = await store.createBucket(random.string(), options);
        key = random.string(20);
        value = genValue();
      });

      afterEach(async () => {
        await bucket.clear();
        await store.close();
      });

      describe("get() and set()", function() {
        it("should set and get data in bucket", async () => {
          await bucket.set(key, value);
          const result = await bucket.get(key);
          assert.deepEqual(result, value);
        });
      });

      describe("del()", function() {

        beforeEach(async () => await bucket.set(key, value));

        it("should delete data from bucket", async () => {
          let result = await bucket.get(key);
          assert.deepEqual(result, value);
          await bucket.del(key);
          await bucket.get(key);
          result = await bucket.get(key);
          assert.notOk(result);
        });

        it("should delete data without a callback", async () => {
          let result = await bucket.get(key);
          assert.deepEqual(result, value);
          await bucket.del(key);
          result = await bucket.get(key);
          assert.notOk(result);
        });
      });

      it("getset()", async () => {
        await bucket.set(key, value);
        const newValue = genValue();
        let result = await bucket.getset(key, newValue);
        assert.deepEqual(value, result);
        result = await bucket.get(key);
        assert.deepEqual(newValue, result);
      });

      it("getdel()", async () => {
        await bucket.set(key, value);
        let result = await bucket.getdel(key);
        assert.deepEqual(value, result);
        result = await bucket.get(key);
        assert.notOk(result);
      });

      it("keys()", async () => {
        let expected: string[] = [];
        for (let i = 0; i < 10; i++) {
          const k = random.string();
          await bucket.set(k, genValue());
          expected.push(k);
        }

        const keys = await bucket.keys();
        assert.sameMembers(expected, keys);
      });

      it("clear()", async () => {
        await bucket.set("key1", value);
        await bucket.set("key2", value);

        let val1 = await bucket.get("key1");
        let val2 = await bucket.get("key2");
        assert.ok(val1);
        assert.ok(val2);

        await bucket.clear();

        val1 = await bucket.get("key1");
        val2 = await bucket.get("key2");

        assert.notOk(val1);
        assert.notOk(val2);
      });
    });
  }

};
