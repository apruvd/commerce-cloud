'use strict';

exports.trigger = function(order) {
    // apruvd call
    var apruvd = require('*/cartridge/scripts/service/apruvd');
    if (order && apruvd.isSendTransaction()) {
        apruvd.createTransaction(order);
    }
}
