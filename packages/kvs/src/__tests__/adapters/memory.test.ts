import delay from 'delay';
import Memory from '../../adapters/memory';
import {Bucket} from '../../bucket';
import {Store} from '../../store';
import {Adapter} from '../../types';
import {random} from '../support';

const createStore = () => Store.create('memory');

const methods = {
  async getWidget(name: string) {
    return {name};
  },
};

describe('Memory', function () {
  describe('get with load', function () {
    let store: Store;
    let bucket: Bucket;
    let key: string;
    let ttl: number;
    let name: string;
    let adapter: Adapter;

    beforeEach(async () => {
      store = createStore();
      ttl = 0.1;
      adapter = store.adapter;

      bucket = store.createBucket({
        ttl: ttl,
        // eslint-disable-next-line @typescript-eslint/no-shadow
        load: name => methods.getWidget(name ?? 'unknown'),
      });
      key = random.string(20);
      name = random.string();
    });

    afterEach(async () => {
      await bucket.clear();
    });

    it('should call back with the result of a function', async () => {
      const widget = await bucket.get(key, name);
      expect(widget).toEqual({name});
    });

    it('should retrieve data from memory when available', async () => {
      let widget = await bucket.get(key, name);
      expect(widget).toBeTruthy();
      const result = await adapter.get(bucket.fullkey(key));
      expect(result).toBeTruthy();

      const spyGet = jest.spyOn(adapter, 'get');
      const spyGetWidget = jest.spyOn(methods, 'getWidget');

      widget = await bucket.get(key, name);
      expect(widget).toEqual({name});
      expect(spyGet).toBeCalledWith(bucket.fullkey(key));
      expect(spyGetWidget).not.toBeCalled();
      spyGet.mockRestore();
      spyGetWidget.mockRestore();
    });

    it('should expire cached result after ttl seconds', async () => {
      let widget = await bucket.get(key, name);
      expect(widget).toEqual({name});
      const result = await adapter.get(bucket.fullkey(key));
      expect(result).toBeTruthy();

      const spyGetWidget = jest.spyOn(methods, 'getWidget');

      await delay(ttl * 1000 + 10);
      widget = await bucket.get(name, name);
      expect(spyGetWidget).toBeCalled();
      expect(widget).toEqual({name});
      spyGetWidget.mockRestore();
    });

    describe('when store.get() calls back with an error', function () {
      it('should bubble up that error', async () => {
        const fakeError = new Error(random.string());

        const spyGet = jest
          .spyOn(adapter, 'get')
          .mockImplementation(async () => {
            throw fakeError;
          });

        await expect(bucket.get(key, name)).rejects.toThrow(fakeError.message);

        spyGet.mockRestore();
      });
    });

    describe('when store.set() calls back with an error', function () {
      it('should bubble up that error', async () => {
        const fakeError = new Error(random.string());

        const spyGet = jest.spyOn(adapter, 'get').mockImplementation(() => {
          throw fakeError;
        });

        await expect(bucket.get(key, name)).rejects.toThrow(fakeError.message);
        spyGet.mockRestore();
      });
    });
  });

  describe('dump and load', function () {
    const key = random.string(10);
    const value = random.string(10);

    it('should dump and load data', async function () {
      let store = Store.create(Memory);
      const bucket = store.bucket('test');
      await bucket.set(key, value);
      const data = (store.adapter as Memory).dump();
      store = Store.create(Memory, {data});
      expect(data).toEqual((store.adapter as Memory).dump());
    });
  });
});
