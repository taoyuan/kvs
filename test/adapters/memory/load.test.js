"use strict";

var assert = require('chai').assert;
var sinon = require('sinon');
var redis = require('redis');
var support = require('../../support');

var getStore = support.store('memory');

var methods = {
    getWidget: function (name, cb) {
        cb(null, {name: name});
    }
};

describe("Memory adapter get with load", function () {
    var store;
    var bucket;
    var key;
    var ttl;
    var name;
    var memory_stub;
    var memory_adapter;

    beforeEach(function () {
        store = getStore();
        ttl = 0.1;
        memory_adapter = store.adapter;
        memory_stub = memory_adapter.createBucket({ttl: ttl});

        sinon.stub(memory_adapter, 'createBucket').returns(memory_stub);

        bucket = store.createBucket({
            ttl: ttl,
            load: function (name, cb) {
                methods.getWidget(name, cb);
            }
        });
        key = support.random.string(20);
        name = support.random.string();
    });

    afterEach(function (done) {
        memory_adapter.createBucket.restore();
        bucket.clear(done);
    });

    it("should call back with the result of a function", function (done) {
        bucket.get(key, name, function (err, widget) {
            assert.notOk(err);
            assert.deepEqual(widget, {name: name});
            done();
        });
    });

    it("should retrieve data from memory when available", function (done) {
        bucket.get(key, name, function (err, widget) {
            assert.notOk(err);
            assert.ok(widget);

            memory_stub.get(bucket.getKey(key), function (err, result) {
                assert.notOk(err);
                assert.ok(result);

                sinon.spy(memory_stub, 'get');
                sinon.spy(methods, 'getWidget');

                bucket.get(key, name, function (err, widget) {
                    assert.notOk(err);
                    assert.deepEqual(widget, {name: name});
                    assert.ok(memory_stub.get.calledWith(bucket.getKey(key)));
                    assert.ok(!methods.getWidget.called);
                    memory_stub.get.restore();
                    methods.getWidget.restore();
                    done();
                });
            });
        });
    });

    it("should expire cached result after ttl seconds", function (done) {
        bucket.get(key, name, function (err, widget) {
            assert.notOk(err);
            assert.deepEqual(widget, {name: name});

            memory_stub.get(bucket.getKey(key), function (err, result) {
                assert.notOk(err);
                assert.ok(result);

                sinon.spy(methods, 'getWidget');

                setTimeout(function () {
                    bucket.get(key, name, function (err, widget) {
                        assert.notOk(err);
                        assert.ok(methods.getWidget.called);
                        assert.deepEqual(widget, {name: name});
                        methods.getWidget.restore();
                        done();
                    });
                }, (ttl * 1000 + 10));
            });
        });
    });

    context("when store.get() calls back with an error", function () {
        it("should bubble up that error", function (done) {
            var fake_error = new Error(support.random.string());

            sinon.stub(memory_stub, 'get', function (key, cb) {
                cb(fake_error);
            });

            bucket.get(key, name, function (err) {
                assert.equal(err, fake_error);
                memory_stub.get.restore();
                done();
            });
        });
    });

    context("when store.set() calls back with an error", function () {
        it("should bubble up that error", function (done) {
            var fake_error = new Error(support.random.string());

            sinon.stub(memory_stub, 'set', function (key, val, cb) {
                cb(fake_error);
            });

            bucket.get(key, name, function (err) {
                assert.equal(err, fake_error);
                memory_stub.set.restore();
                done();
            });
        });
    });
});