import {Store} from '../store';
import {expect} from '@tib/testlab';

describe('bucket', function () {
  it('should work with typing', async function () {
    interface Options {
      a: string;
      b: number;
    }
    const store = Store.create('memory');
    const bucket = await store.bucket<Options>('test');
    await bucket.set('a', 'a');
    await bucket.set('b', 1);
    expect(await bucket.get('a')).equal('a');
    expect(await bucket.get('b')).equal(1);
  });
});
