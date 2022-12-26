/**
 *
 * Services used for the apruvd API.
 *
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var apruvdServiceDefinition = require('*/cartridge/scripts/service/apruvdServiceDefinition');

/**
 * Builds the request for API authentication.
 */
function receiveRefreshToken() {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.receiveRefreshToken);

    try {
        var result = service.call();
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return null;
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

/**
 * Bulds request for receiving access token
 * @param {Object} params
 */
function receiveAccessToken(params) {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.receiveAccessToken);

    try {
        var result = service.call({
            refreshToken: params.refreshToken
        });
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return null;
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

/**
 * Bulds request for creating transaction
 * @param {Object} params
 */
function createTransaction(params) {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.createTransaction);

    try {
        var result = service.call({
            accessToken: params.accessToken,
            requestBody: params.requestBody
        });
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return {
                error: result.error,
                errorMessage: result.errorMessage ? result.errorMessage : ""
            }
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

/**
 * Bulds request for receiving merchant settings
 * @param {Object} params
 */
function getMerchantSettings(params) {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.getMerchantSettings);

    try {
        var result = service.call({
            accessToken: params.accessToken
        });
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return null;
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

/**
 * Bulds request for sending partial update
 * @param {Object} params
 */
function partialUpdate(params) {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.partialUpdate);

    try {
        var result = service.call({
            accessToken: params.accessToken,
            orderNumber: params.orderNumber,
            status: params.status
        });
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return null;
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

/**
 * Bulds request for receiving transaction data
 * @param {Object} params
 */
function getTransaction(params) {
    var serviceLog = Logger.getLogger('apruvd');
    var serviceName  = 'apruvd.REST.service';
    var service = LocalServiceRegistry.createService(serviceName, apruvdServiceDefinition.getTransaction);

    try {
        var result = service.call({
            accessToken: params.accessToken,
            orderId: params.orderId
        });
        if (result.ok) {
            var resultObject = result ? JSON.parse(result.object) : null;
            return resultObject;
        } else {
            serviceLog.error("Error: {0} : {1}", result.error, result.errorMessage);
            return null;
        }
    } catch (e) {
        serviceLog.error("Error: API Call was interrupted. Exception: {0}", e.message);
    }
}

module.exports = {
    receiveRefreshToken: receiveRefreshToken,
    receiveAccessToken: receiveAccessToken,
    createTransaction: createTransaction,
    getMerchantSettings: getMerchantSettings,
    partialUpdate: partialUpdate,
    getTransaction: getTransaction
};
