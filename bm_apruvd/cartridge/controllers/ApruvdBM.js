'use strict';

/**
 * Apruvd BM controller.
 *
 * @module controllers/ApruvdBM
 */

var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

/**
 * Render Orders Dashboard in Apruvd BM module
 */
exports.OrdersDashboard = function() {
    var PagingModel = require('dw/web/PagingModel');
    var URLUtils = require('dw/web/URLUtils');
    var orders;
    var isOrderIdSubmitted = !request.httpParameterMap.orderId.empty;
    var isEmailSubmitted = !request.httpParameterMap.email.empty;
    var isNameSubmitted = !request.httpParameterMap.name.empty;
    var query = 'creationDate>={0}';
    if (isOrderIdSubmitted) {
        query = query + ' AND orderNo={1}';
    }
    if (isEmailSubmitted) {
        query = query + ' AND customerEmail={2}';
    }
    if (isNameSubmitted) {
        query = query + ' AND customerName ILIKE {3}';
    }
    var apruvdInstallationStartDate = Site.getCurrent().getCustomPreferenceValue("apruvdInstallationStartDate") || new Date(0);
    orders = OrderMgr.searchOrders(
        query,
        'creationDate desc',
        apruvdInstallationStartDate,
        request.httpParameterMap.orderId.value,
        request.httpParameterMap.email.value,
        request.httpParameterMap.name.value
    );

    var pageSize = Number(request.httpParameterMap.pagesize.value) || 20;
    var pageStart = Number(request.httpParameterMap.pagestart.value) || 0;
    var pagingModel = new PagingModel(orders, orders.count);
    pagingModel.setStart(pageStart);
    pagingModel.setPageSize(pageSize);
    var nextPageUrl = pageStart + pageSize < orders.count ? URLUtils.url('ApruvdBM-OrdersDashboard', 'orderId', request.httpParameterMap.orderId.value, 'pagesize', pageSize, 'pagestart', pageStart + pageSize).toString() : '';
    var prevPageUrl = pageStart - pageSize >= 0 ? URLUtils.url('ApruvdBM-OrdersDashboard', 'orderId', request.httpParameterMap.orderId.value, 'pagesize', pageSize, 'pagestart', pageStart - pageSize).toString() : '';
    require('dw/template/ISML').renderTemplate("apruvdOrdersLandingPage", {
        ordersIterator: pagingModel.pageElements,
        ordersCount: orders.count,
        nextPageUrl: nextPageUrl,
        prevPageUrl: prevPageUrl
    });
}

/**
 * Handle Actions on orders in Apruvd BM Module
 */
exports.Elevate = function() {
    var CSRFProtection = require('dw/web/CSRFProtection');
    if (CSRFProtection.validateRequest()) {
        var serviceResponse;
        var apruvd = require('*/cartridge/scripts/service/apruvd');
        var order = OrderMgr.getOrder(request.httpParameterMap.orderId.value);
        var referer = request.httpReferer.replace("&error=true", "");
        if (request.httpParameterMap.isParameterSubmitted("elevate")) {
            serviceResponse = apruvd.partialUpdate(order);
        } else if (request.httpParameterMap.isParameterSubmitted("submit")) {
            serviceResponse = apruvd.resubmitTransaction(order);
        }
        if (!serviceResponse || !empty(serviceResponse.errorMessage)) {
            response.redirect(referer + '&error=true');
        } else {
            response.redirect(referer);
        }
    }
}

exports.OrdersDashboard.public = true;
exports.Elevate.public = true;