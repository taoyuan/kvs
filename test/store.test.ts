import "./support";
import { assert } from "chai";
import { Store } from "../src";
import { random } from "./support";

describe("Store", function() {

  let bucket;
  let key;
  let value;

  beforeEach(() => {
    key = random.string();
    value = random.string();
  });

  describe("instantiating with adapter name", function() {
    it("should allows to pass in built-in adapter", async () => {
      bucket = await Store.create("memory").bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      assert.equal(result, value);
    });

    it("should allows to pass in built-in adapter with promise", async () => {
      bucket = await Store.create("memory").bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      assert.equal(result, value);
      await bucket.clear();
    });
  });

  describe("instantiating with custom adapter", function() {
    it("should allows to pass in a module", async () => {
      const initializer = require("../lib/adapters/memory");
      bucket = await Store.create(initializer).bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      assert.equal(result, value);
    });
  });
});
