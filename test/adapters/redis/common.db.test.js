"use strict";

describe('Redis adapter common features with `db` option', function() {

    function getStore(cb) {
        var store = require('../../../').Store('redis', {db: 2});
        store.ready(function () {
            cb(store);
        });
    }

    require('../../common.batch.js')(getStore);

});