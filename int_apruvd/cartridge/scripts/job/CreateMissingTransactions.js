'use strict';

var apruvd   = require('*/cartridge/scripts/service/apruvd');
var OrderMgr = require('dw/order/OrderMgr');
var Logger   = require('dw/system/Logger');
var Site = require('dw/system/Site');

/**
 * Main entry point for the Job call
 */
function execute() {
    var serviceLog = Logger.getLogger('apruvd');
    if (Site.getCurrent().getCustomPreferenceValue("apruvdMerchantId")) {
        var useApruvdAsSecondFraudDetection = Site.getCurrent().getCustomPreferenceValue("apruvdUseAsSecondFraudDetection");
        var apruvdInstallationStartDate = Site.getCurrent().getCustomPreferenceValue("apruvdInstallationStartDate") || new Date(0);
        var ordersIterator;
        if (useApruvdAsSecondFraudDetection) {
            ordersIterator = OrderMgr.searchOrders("custom.apruvdCheckOrder={0} AND creationDate>={1}", 'creationDate desc', true, apruvdInstallationStartDate);
        } else {
            ordersIterator = OrderMgr.searchOrders("(custom.apruvdStatus={0} OR custom.apruvdStatus={1}) AND creationDate>={2}", 'creationDate desc', null, "", apruvdInstallationStartDate);
        }

        serviceLog.info('Orders count: {0}', ordersIterator.count);

        while (ordersIterator.hasNext()) {
            var order = ordersIterator.next();
            serviceLog.info('Processing Order Number: {0}', order.orderNo);
            var serviceResponse = apruvd.resubmitTransaction(order);
            if (!serviceResponse || !empty(serviceResponse.errorMessage)) {
                serviceLog.info('Error Processing Order Number: {0}', order.orderNo);
            }
        }

        serviceLog.info('Transaction re-creation job done.');
    }

}

exports.execute = execute;
