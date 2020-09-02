import delay from 'delay';
import {expect, sinon} from '@tib/testlab';
import {Store} from '../../../store';
import {Bucket} from '../../../bucket';
import {random} from '../../support';
import {Adapter} from '../../../types';

const getStore = () => Store.create('memory');

const methods = {
  async getWidget(name: string) {
    return {name};
  },
};

describe('Memory adapter get with load', function () {
  let store: Store;
  let bucket: Bucket;
  let key: string;
  let ttl: number;
  let name: string;
  let adapter: Adapter;

  beforeEach(async () => {
    store = getStore();
    ttl = 0.1;
    adapter = store.adapter;

    bucket = await store.createBucket({
      ttl: ttl,
      // eslint-disable-next-line no-shadow
      load: (name) => methods.getWidget(name ?? 'unknown'),
    });
    key = random.string(20);
    name = random.string();
  });

  afterEach(async () => {
    await bucket.clear();
  });

  it('should call back with the result of a function', async () => {
    const widget = await bucket.get(key, name);
    expect(widget).deepEqual({name});
  });

  it('should retrieve data from memory when available', async () => {
    let widget = await bucket.get(key, name);
    expect(widget).ok();
    const result = await adapter.get(bucket.fullkey(key));
    expect(result).ok();

    const spyGet = sinon.spy(adapter, 'get');
    const spyGetWidget = sinon.spy(methods, 'getWidget');

    widget = await bucket.get(key, name);
    expect(widget).deepEqual({name});
    expect(spyGet.calledWith(bucket.fullkey(key))).ok();
    expect(spyGetWidget.called).not.ok();
    spyGet.restore();
    spyGetWidget.restore();
  });

  it('should expire cached result after ttl seconds', async () => {
    let widget = await bucket.get(key, name);
    expect(widget).deepEqual({name});
    const result = await adapter.get(bucket.fullkey(key));
    expect(result).ok();

    const spyGetWidget = sinon.spy(methods, 'getWidget');

    await delay(ttl * 1000 + 10);
    widget = await bucket.get(name, name);
    expect(spyGetWidget.called).ok();
    expect(widget).deepEqual({name});
    spyGetWidget.restore();
  });

  context('when store.get() calls back with an error', function () {
    it('should bubble up that error', async () => {
      const fakeError = new Error(random.string());

      const spyGet = sinon.stub(adapter, 'get').callsFake(async () => {
        throw fakeError;
      });

      await expect(bucket.get(key, name)).rejectedWith(fakeError.message);

      spyGet.restore();
    });
  });

  context('when store.set() calls back with an error', function () {
    it('should bubble up that error', async () => {
      const fakeError = new Error(random.string());

      const spyGet = sinon.stub(adapter, 'set').callsFake(() => {
        throw fakeError;
      });

      await expect(bucket.get(key, name)).rejectedWith(fakeError.message);
      spyGet.restore();
    });
  });
});
