"use strict";

describe('Memory adapter common features', function() {

    function getStore() {
        return require('../../../').Store('memory');
    }

    require('../../common.batch.js')(getStore);

});