'use strict';

const server = require('server');
server.extend(module.superModule);
var Site = require('dw/system/Site');

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    if (Site.current.preferences.custom.apruvdEnabled && Site.current.preferences.custom.apruvdMerchantId && !Site.current.preferences.custom.apruvdUseAsSecondFraudDetection) {
        var viewData = res.getViewData();
        var orderID = viewData.orderID;
        var OrderMgr = require('dw/order/OrderMgr');
        var order = (orderID) ? OrderMgr.getOrder(orderID) : null;
        // apruvd call
        var apruvd = require('*/cartridge/scripts/service/apruvd');
        if (order && apruvd.isSendTransaction()) {
            apruvd.createTransaction(order);
        }
    }

    return next();
});

module.exports = server.exports();
