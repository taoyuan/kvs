import {Bucket, Store} from '..';
import {random} from './support';
import {expect} from '@tib/testlab';

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
      bucket = await Store.create('memory').bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });

    it('should allows to pass in built-in adapter with promise', async () => {
      bucket = await Store.create('memory').bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
      await bucket.clear();
    });
  });

  describe('instantiating with adapter constructor', function () {
    it('should allows to pass in a module', async () => {
      const Adapter = require('../adapters/memory').default;
      bucket = await Store.create(Adapter).bucket();
      await bucket.set(key, value);
      const result = await bucket.get(key);
      expect(result).equal(value);
    });
  });
});
