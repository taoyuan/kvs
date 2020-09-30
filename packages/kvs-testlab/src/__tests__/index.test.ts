import {expect} from '@tib/testlab';
import {kvsTestAll} from '../suite-all';

describe('testlab', function () {
  it('should export test suite', function () {
    expect(kvsTestAll).type('function');
  });
});
