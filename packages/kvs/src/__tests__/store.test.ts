import {expect} from '@tib/testlab';
import {Bucket, Store} from '..';
import {random} from './support';

describe('Store', function () {
  let bucket: Bucket;
  let key: string;
  let value: string;

  beforeEach(() => {
    key = random.string();
    value = random.string();
  });

  describe('instantiating with adapter name', function () {
    it('should allows to pass in built-in adapter', async () => {
      bucket = Store.create('memory').bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });

    it('should allows to pass in built-in adapter with promise', async () => {
      bucket = Store.create('memory').bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
      await bucket.clear();
    });

    it('should initiate with options.name', async function () {
      bucket = Store.create({name: 'memory'}).bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
      await bucket.clear();
    });
  });

  describe('instantiating with adapter constructor', function () {
    it('should allows to pass as first parameter', async () => {
      const Adapter = require('../adapters/memory').default;
      bucket = Store.create(Adapter).bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });

    it('should allows to pass as options.adapter', async () => {
      const Adapter = require('../adapters/memory').default;
      bucket = Store.create({adapter: Adapter}).bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });
  });

  describe('instantiating with adapter instance', function () {
    it('should allows to pass as first parameter', async () => {
      const Adapter = require('../adapters/memory').default;
      const adapter = new Adapter();
      bucket = Store.create(adapter).bucket();
      expect(bucket.adapter).equal(adapter);
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });

    it('should allows to pass as options.adapter', async () => {
      const Adapter = require('../adapters/memory').default;
      const adapter = new Adapter();
      bucket = Store.create({adapter}).bucket();
      expect(bucket.adapter).equal(adapter);
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });
  });
});
