import {Store} from '../../..';

describe('Memory adapter common features', function () {
  require('../../common.batch')(() => Store.create('memory'));
});
