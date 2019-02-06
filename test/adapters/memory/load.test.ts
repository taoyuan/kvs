"use strict";

import { assert } from "chai";
import sinon = require("sinon");
import s = require("../../support");
import { AdapterFactory, Bucket, Store } from "../../../src";
import { wait } from "../../support";

const getStore = s.store("memory");

const methods = {
  async getWidget(name) {
    return { name };
  }
};

describe("Memory adapter get with load", function() {
  let store: Store;
  let bucket: Bucket;
  let key;
  let ttl;
  let name;
  let memoryStub;
  let memoryAdapter: AdapterFactory<any>;

  beforeEach(async () => {
    store = await getStore();
    ttl = 0.1;
    memoryAdapter = store.factory;
    memoryStub = memoryAdapter.create({ ttl: ttl });

    sinon.stub(memoryAdapter, "create").returns(memoryStub);

    bucket = await store.createBucket({
      ttl: ttl,
      load: async (name) => await methods.getWidget(name)
    });
    key = s.random.string(20);
    name = s.random.string();
  });

  afterEach(async () => {
    // @ts-ignore
    await memoryAdapter.create.restore();
    await bucket.clear();
  });

  it("should call back with the result of a function", async () => {
    const widget = await bucket.get(key, name);
    assert.deepEqual(widget, { name });
  });

  it("should retrieve data from memory when available", async () => {
    let widget = await bucket.get(key, name);
    assert.ok(widget);
    const result = await memoryStub.get(bucket.fullkey(key));
    assert.ok(result);

    sinon.spy(memoryStub, "get");
    sinon.spy(methods, "getWidget");

    widget = await bucket.get(key, name);
    assert.deepEqual(widget, { name });
    assert.ok(memoryStub.get.calledWith(bucket.fullkey(key)));
    // @ts-ignore
    assert.notOk(methods.getWidget.called);
    memoryStub.get.restore();
    // @ts-ignore
    methods.getWidget.restore();
  });

  it("should expire cached result after ttl seconds", async () => {
    let widget = await bucket.get(key, name);
    assert.deepEqual(widget, { name });
    let result = await memoryStub.get(bucket.fullkey(key));
    assert.ok(result);

    sinon.spy(methods, "getWidget");

    await wait(ttl * 1000 + 10);
    widget = await bucket.get(name, name);
    // @ts-ignore
    assert.ok(methods.getWidget.called);
    assert.deepEqual(widget, { name: name });
    // @ts-ignore
    methods.getWidget.restore();
  });

  context("when store.get() calls back with an error", function() {
    it("should bubble up that error", async () => {
      const fakeError = new Error(s.random.string());

      sinon.stub(memoryStub, "get").callsFake(async () => {
        throw fakeError;
      });

      await assert.isRejected(bucket.get(key, name), fakeError.message);

      memoryStub.get.restore();
    });
  });

  context("when store.set() calls back with an error", function() {
    it("should bubble up that error", async () => {
      const fakeError = new Error(s.random.string());

      sinon.stub(memoryStub, "set").callsFake(() => {
        throw fakeError;
      });

      await assert.isRejected(bucket.get(key, name), fakeError.message);
      memoryStub.set.restore();
    });
  });
});
