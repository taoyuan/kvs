"use strict";

const {Store} = require('../../..');

describe('Memory adapter common features', function () {

  function getStore(cb) {
    const store = new Store('memory');
    store.ready(function () {
      cb(store);
    });
  }

  require('../../common.batch.js')(getStore);

});
