"use strict";

const {Store} = require('../../..');

describe('Redis adapter common features with `db` option', function () {

  function getStore(cb) {
    const store = new Store('redis', {db: 2});
    store.ready(function () {
      cb(store);
    });
  }

  require('../../common.batch.js')(getStore);

});
