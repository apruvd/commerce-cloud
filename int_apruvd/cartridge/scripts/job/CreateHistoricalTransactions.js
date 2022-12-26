'use strict';

var apruvd   = require('*/cartridge/scripts/service/apruvd');
var OrderMgr = require('dw/order/OrderMgr');
var Logger   = require('dw/system/Logger');
var Site = require('dw/system/Site');

/**
 * Main entry point for the Job call
 */
function execute(params) {
    var serviceLog = Logger.getLogger('apruvd');
    if (Site.getCurrent().getCustomPreferenceValue("apruvdMerchantId") && apruvd.isTrainingData()) {
        var apruvdInstallationStartDate = Site.getCurrent().getCustomPreferenceValue("apruvdInstallationStartDate") || new Date(0);
        var batchSize = params.batchSize && Number(params.batchSize) < 100000 ? Number(params.batchSize) : 100000;
        var query = "(custom.apruvdStatus={0} OR custom.apruvdStatus={1}) AND creationDate<{2}";
        var ordersIterator = OrderMgr.searchOrders(query, 'creationDate desc', null, "", apruvdInstallationStartDate);
        var numberOfOrders = ordersIterator.count;
        serviceLog.info('Orders count: {0}', numberOfOrders);
        var bucketSize = 10;
        var numberOfBuckets = numberOfOrders % bucketSize === 0 ? numberOfOrders / bucketSize : Math.floor(numberOfOrders / bucketSize) + 1;
        var count = 0;
        for (var i = 1; i <= numberOfBuckets ; i++) {
            while (ordersIterator.hasNext() && count < bucketSize) {
                if (bucketSize*(i-1) + count == batchSize) {
                    break;
                }
                count += 1;
                var order = ordersIterator.next();
                serviceLog.info('Processing Order Number: {0}', order.orderNo);
                var serviceResponse = apruvd.createTransaction(order, true);
                if (!serviceResponse || !empty(serviceResponse.errorMessage)) {
                    serviceLog.info('Error Processing Order Number: {0}', order.orderNo);
                }
            }
            if (bucketSize*(i-1) + count === batchSize) {
                ordersIterator.close();
                break;
            } else if (count === bucketSize) {
                ordersIterator.close();
                ordersIterator = OrderMgr.searchOrders(query, 'creationDate desc', null, "", apruvdInstallationStartDate);
                ordersIterator.forward(i*bucketSize, bucketSize);
                count = 0;
            }
        }
        ordersIterator.close();
        serviceLog.info('Historical transaction creation job done.');
    }

}

exports.execute = execute;
