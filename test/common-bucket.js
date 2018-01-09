"use strict";

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;
var support = require('./support');
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
        return {name: support.random.string()};
      },
      options: {type: 'hash'}
    }
  };

  _.forOwn(types, function (type, name) {
    testKVS(name, type.genValue, type.options);
  });

  function testKVS(name, genValue, options) {

    context('bucket ' + name, function () {
      var store;
      var bucket;
      var key;
      var value;

      beforeEach(function (done) {
        getStore(function (s) {
          store = s;
          bucket = store.createBucket(support.random.string(), options);
          key = support.random.string(20);
          value = genValue();
          done();
        });
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

      it('keys()', async function () {
        let _keys = [];
        for (let i = 0; i < 10; i++) {
          const k = support.random.string();
          const result = await bucket.set(k, genValue());
          _keys.push(k);
        }

        const keys = await bucket.keys();
        assert.sameMembers(_keys, keys);
      });

      it('clear()', async function () {
        await bucket.set('key1', value);
        await  bucket.set('key2', value);

        let val1 = await bucket.get('key1');
        let val2 = await bucket.get('key2');
        assert.ok(val1);
        assert.ok(val2);

        await bucket.clear();

        val1 = await bucket.get('key1');
        val2 = await bucket.get('key2');

        assert.notOk(val1);
        assert.notOk(val2);
      });
    });
  }

};
