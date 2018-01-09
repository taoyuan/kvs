"use strict";

var assert = require('chai').assert;
var sinon = require('sinon');
var redis = require('redis');
var support = require('../../support');

var getStore = support.store('redis');

var methods = {
  getWidget: function (name, cb) {
    cb(null, {name: name});
  }
};

describe("Redis adapter get with load", function () {
  var bucket;
  var key;
  var ttl;
  var name;
  var redis_client;

  before(function () {
    redis_client = redis.createClient();
    sinon.stub(redis, 'createClient').returns(redis_client);
  });

  beforeEach(function () {
    bucket = getStore().createBucket({
      load: function (name, cb) {
        methods.getWidget(name, cb);
      }
    });
    key = support.random.string(20);
    name = support.random.string();
  });

  after(function (done) {
    redis.createClient.restore();
    bucket.clear(() => {
      redis_client.end(true);
      done();
    });
  });

  it("should calls back with the result of load", function (done) {
    bucket.get(key, name, function (err, widget) {
      assert.notOk(err);
      assert.deepEqual(widget, {name});
      done();
    });
  });

  it("should caches the result of the function in redis", function (done) {
    bucket.get(key, name, function (err, widget) {
      assert.notOk(err);
      assert.ok(widget);

      redis_client.get(bucket.getKey(key), function (err, result) {
        assert.notOk(err);
        assert.deepEqual(JSON.parse(result), {name: name});

        done();
      });
    });
  });

  context("when load function calls back with an error", function () {
    it("should calls back with that error and doesn't bucket result", function (done) {
      var fake_error = new Error(support.random.string());
      sinon.stub(methods, 'getWidget').callsFake(function (key, cb) {
        cb(fake_error, {name: name});
      });

      bucket.get(key, name, function (err, widget) {
        methods.getWidget.restore();
        assert.equal(err.cause || err, fake_error);
        assert.ok(!widget);

        redis_client.get(bucket.getKey(key), function (err, result) {
          assert.notOk(err);
          assert.ok(!result);
          done();
        });
      });
    });
  });

  it("should retrieves data from redis when available", function (done) {
    bucket.get(key, name, function (err, widget) {
      assert.notOk(err);
      assert.ok(widget);

      redis_client.get(bucket.getKey(key), function (err, result) {
        assert.notOk(err);
        assert.ok(result);

        sinon.spy(redis_client, 'get');

        bucket.get(key, function (err, widget) {
          assert.notOk(err);
          assert.deepEqual(widget, {name: name});
          assert.ok(redis_client.get.calledWith(bucket.getKey(key)));
          redis_client.get.restore();
          done();
        });
      });
    });
  });

  context("when using ttl", function () {
    beforeEach(function () {
      ttl = 50;
      bucket = getStore().createBucket({
        ttl: ttl,
        load: function (name, cb) {
          methods.getWidget(name, cb);
        }
      });
    });

    afterEach(function (done) {
      bucket.clear(done);
    });

    it("expires cached result after ttl seconds", function (done) {
      bucket.get(key, name, function (err, widget) {
        assert.notOk(err);
        assert.ok(widget);

        redis_client.ttl(bucket.getKey(key), function (err, result) {
          assert.notOk(err);
          support.assertWithin(result, ttl, 2);
          done();
        });
      });
    });
  });
});
