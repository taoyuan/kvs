import {Store} from '../store';

describe('bucket', function () {
  it('should work with typing', async function () {
    interface Options {
      a: string;
      b: number;
    }
    const store = Store.create('memory');
    const bucket = store.bucket<Options>('test');
    await bucket.set('a', 'a');
    await bucket.set('b', 1);
    expect(await bucket.get('a')).toBe('a');
    expect(await bucket.get('b')).toBe(1);
  });
});
