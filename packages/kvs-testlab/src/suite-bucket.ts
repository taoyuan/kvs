import {random} from './support';

export function kvsTestBuckets(provider: Function) {
  const types: any = {
    string: {
      genValue: function () {
        return random.string();
      },
      options: {},
    },
    hash: {
      genValue: function () {
        return {name: random.string()};
      },
      options: {type: 'hash'},
    },
  };

  Object.keys(types).map(name =>
    testKVS(name, types[name].genValue, types[name].options),
  );

  function testKVS(
    name: string,
    genValue: () => string,
    options: Record<string, any>,
  ) {
    describe('bucket ' + name, function () {
      let store: any;
      let bucket: any;
      let key: string;
      let value: any;

      beforeEach(async () => {
        store = provider();
        bucket = await store.createBucket(random.string(), options);
        key = random.string(20);
        value = genValue();
      });

      afterEach(async () => {
        await bucket.clear();
        await store.close();
      });

      describe('has()', function () {
        it('should has worked', async function () {
          expect(await bucket.has(key)).toBe(0);
          await bucket.set(key, value);
          expect(await bucket.has(key)).toBe(1);
        });
      });

      describe('get() and set()', function () {
        it('should set and get data in bucket', async () => {
          await bucket.set(key, value);
          const result = await bucket.get(key);
          expect(result).toEqual(value);
        });
      });

      describe('del()', function () {
        beforeEach(() => bucket.set(key, value));

        it('should delete data from bucket', async () => {
          let result = await bucket.get(key);
          expect(result).toEqual(value);
          await bucket.del(key);
          await bucket.get(key);
          result = await bucket.get(key);
          expect(result).toBeFalsy();
        });

        it('should delete data without a callback', async () => {
          let result = await bucket.get(key);
          expect(result).toEqual(value);
          await bucket.del(key);
          result = await bucket.get(key);
          expect(result).toBeFalsy();
        });
      });

      it('getset()', async () => {
        await bucket.set(key, value);
        const newValue = genValue();
        let result = await bucket.getset(key, newValue);
        expect(value).toEqual(result);
        result = await bucket.get(key);
        expect(newValue).toEqual(result);
      });

      it('getdel()', async () => {
        await bucket.set(key, value);
        let result = await bucket.getdel(key);
        expect(value).toEqual(result);
        result = await bucket.get(key);
        expect(result).toBeFalsy();
      });

      it('keys()', async () => {
        const expected: string[] = [];
        for (let i = 0; i < 10; i++) {
          const k = random.string();
          await bucket.set(k, genValue());
          expected.push(k);
        }

        const bucket2 = store.bucket(random.string(8));
        for (let i = 0; i < 10; i++) {
          const k = random.string();
          await bucket2.set(k, genValue());
        }

        const keys = await bucket.keys();
        expect(expected.sort()).toEqual(keys.sort());
      });

      it('clear()', async () => {
        const bucket2 = store.bucket(random.string(8));

        await bucket.set('key', value);
        await bucket2.set('key', value);

        await bucket.clear();

        const val1 = await bucket.get('key');
        const val2 = await bucket2.get('key');

        expect(val1).toBeFalsy();
        expect(val2).toBeTruthy();
      });
    });
  }
}
