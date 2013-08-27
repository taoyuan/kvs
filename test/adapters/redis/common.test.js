"use strict";

describe('Redis adapter common features', function() {

    function getStore() {
        return require('../../../').Store('redis');
    }

    require('../../common.batch.js')(getStore);

});