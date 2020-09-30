import {kvsTestAll} from 'kvs-testlab';
import {Store} from '..';

describe('adapters/common', function () {
  kvsTestAll(() => Store.create('memory'));
});
