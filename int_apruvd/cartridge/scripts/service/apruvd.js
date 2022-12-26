/**
* Main Apruvd Script File
*
*/
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var SitePreferences = require('dw/system/Site').current.preferences;
var apruvdService = require('*/cartridge/scripts/service/apruvdService');

/**
 * Creates Apruvd transaction from SFCC order
 * @param {dw.order.Order} order
 * @returns {Object} createTransactionResponse
 */
function createTransaction(order) {
    var createTransactionResponse = apruvdService.createTransaction({
        accessToken: StringUtils.encodeBase64(`${SitePreferences.custom.apruvdApiKeyId}:${SitePreferences.custom.apruvdApiKeySecret}`),
        requestBody: getParams(order),
    });
    if (createTransactionResponse && empty(createTransactionResponse.errorMessage)) {
        Transaction.wrap(function() {
            order.custom.apruvdStatus = createTransactionResponse["status"];
            order.custom.apruvdTransactionID = createTransactionResponse["transaction_id"];
            order.custom.apruvdBasicRulesTripped = JSON.stringify(createTransactionResponse["basic_rules_tripped"]);
            order.custom.apruvdCheckOrder = false;
        });
    }

    return createTransactionResponse;
}

/**
 * Receives Apruvd transaction data for SFCC order
 * @param {dw.order.Order} order
 * @returns {Object} getTransactionResponse
 */
function getTransaction(order) {
    var getTransactionResponse = apruvdService.getTransaction({
        accessToken: generateOauthToken(),
        orderId: order.orderNo
    });
    if (getTransactionResponse) {
        Transaction.wrap(function() {
            order.custom.apruvdStatus = getTransactionResponse["status"];;
            order.custom.apruvdBasicRulesTripped = JSON.stringify(getTransactionResponse["basic_rules_tripped"]);
            order.custom.apruvdCheckOrder = false;
        });
    }
    return getTransactionResponse;
}

/**
 * Submits Apruvd transaction from SFCC that already exists order
 * but has no value for custom.apruvdStatus
 * If it already exists on Apruvd site, get data and save to SFCC
 * @param {dw.order.Order} order
 * @returns {Object} serviceResponse
 */
function resubmitTransaction(order) {
    var serviceResponse = createTransaction(order);
    if (serviceResponse && serviceResponse.error === 400 && serviceResponse.errorMessage.indexOf("Transaction with order_id " + order.orderNo + " already exists") >= 0) {
        serviceResponse = getTransaction(order);
    }
    return serviceResponse;
}

/**
 * Partialy updates transaction
 * @param {dw.order.Order} order
 * @returns {Object}
 */
function partialUpdate(order) {
    if (isElevateAvailable(order)) {
        return callPartialUpdate(order);
    } else {
        return null;
    }
}

/**
 * Checks if conditions for transaction elevate are met
 * @param {dw.order.Order} order
 * @returns {boolean} isElevateAvailable
 */
function isElevateAvailable(order) {
    var servicePlan;
    var apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', SitePreferences.custom.apruvdMerchantId);
    var alreadyIndemnifiedTransaction = hasAlreadyIndemnifiedTransactions(order);
    var isElevateAvailable;
    if (!empty(order.custom.apruvdStatus) && order.custom.apruvdStatus !== 'Historical' && order.custom.apruvdStatus !== 'Reviewing' && apruvdTokensCO && !alreadyIndemnifiedTransaction) {
        servicePlan = apruvdTokensCO.custom.apruvdServicePlan;
        switch (servicePlan) {
            case 'Basic':
                var basicRulesTripped = order.custom.apruvdBasicRulesTripped || [];
                if (JSON.parse(basicRulesTripped).length < 1) {
                    isElevateAvailable = false;
                }
                break;
            case 'Complete Coverage':
                isElevateAvailable = false;
            default:
                isElevateAvailable = true;
                break;
        }
    }
    return isElevateAvailable;
}

/**
 * Checks if transaction should be sent during checkout depending on version and service plan.
 * In case of V3 API and "Complete Coverage", transaction will be sent manually from Business Manager module
 * @param {dw.order.Order} order
 * @returns {boolean} isSendTransaction
 */
function isSendTransaction() {
    var apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', SitePreferences.custom.apruvdMerchantId);

    return apruvdTokensCO ? apruvdTokensCO.custom.apruvdServicePlan === 'Complete Coverage' : false;
}

/**
 * Checks if training_data is set to true in merchant settings
 * @returns {boolean} isTrainingData
 */
function isTrainingData() {
    var apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', SitePreferences.custom.apruvdMerchantId);

    return apruvdTokensCO ? apruvdTokensCO.custom.apruvdTrainingData : false;
}

/**
 * Creates partial update request for SFCC order
 * with Reviewing status
 * @param {dw.order.Order} order
 * @retirns {Object} partialUpdateResponse
 */
function callPartialUpdate(order) {
    var partialUpdateResponse =  apruvdService.partialUpdate({
        accessToken: generateOauthToken(),
        orderNumber: order.orderNo,
        status: 'Reviewing'
    });
    if (partialUpdateResponse) {
        Transaction.wrap(function() {
            order.custom.apruvdStatus = partialUpdateResponse.status;
        });
    }
    return partialUpdateResponse;
}

/**
 * Render script tags for html header
 * @param {String} pipelineName
 * @param {String} tag
 */
function renderHeaderScript(pipelineName, tag) {
    if (pipelineName) {
        require('dw/template/ISML').renderTemplate('apruvdInclude', {
            pageId: getPageId(pipelineName),
            tag: tag
        });
    }
}

/**
 * Get apruvd page ID used in service tag
 * @param {String} pipelineName
 * @returns {String}
 */
function getPageId(pipelineName) {
    var pageIdMapping = SitePreferences.custom.apruvdPageIdMapping;
    var pageIdMappingObj = JSON.parse(pageIdMapping) || {};
    return pageIdMappingObj[pipelineName] || pipelineName;
}

/**
 * Process merchant settings data and save to custom object
 * @param {Object} obj
 */
function processMerchantSettings(obj) {
    var merchantId = SitePreferences.custom.apruvdMerchantId;

    if (obj) {
        Transaction.wrap(function() {
            var apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', merchantId) || CustomObjectMgr.createCustomObject('apruvdTokens', merchantId);
            apruvdTokensCO.custom.apruvdDataConnection = obj['data_connection'];
            apruvdTokensCO.custom.apruvdServicePlan = obj['service_plan'];
            apruvdTokensCO.custom.apruvdTrainingData = obj['training_data'];
            apruvdTokensCO.custom.apruvdBasicRules = JSON.stringify(obj['basic_rules']);
            apruvdTokensCO.custom.apruvdRequireNotesOnApproves = obj['require_notes_on_approves'];
            apruvdTokensCO.custom.apruvdRequireNotesOnDeclines = obj['require_notes_on_declines'];
            apruvdTokensCO.custom.apruvdEnforceUniqueOrderId = obj['enforce_unique_order_id'];
            apruvdTokensCO.custom.apruvdVersion = obj['integration_version'];
        });
    }
}

/**
 * Validates web hook header and check if it is authorized
 * @param {dw.util.Map} headers
 * @returns {boolean}
 */
function validateWebHook(headers) {
    var apiKey = SitePreferences.custom.apruvdWebhookApiKey;
    var clientSecret = SitePreferences.custom.apruvdWebhookApiKeySecret;
    var StringUtils = require('dw/util/StringUtils');
    var authorization = headers.get('x-is-authorization');
    return authorization === 'Basic ' + StringUtils.encodeBase64(apiKey + ':' + clientSecret);
}

/**
 * Processes review complete data and saves to order object
 * @param {Object} body
 */
function processReviewComplete(body) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(body.order_num);
    Transaction.wrap(function() {
        order.custom.apruvdStatus = body.status;
        if (body.notes) {
            order.addNote('Apruvd', body.notes);
        }
    });
}

/**
 * Corrects fields according to data from web hook
 * @param {String} field
 * @param {String} newValue
 * @param {dw.order.Order} order
 */
function correctFieldValue(field, newValue, order) {
    Transaction.wrap(function() {
        switch(field) {
            case "shipping_address_2":
                order.defaultShipment.shippingAddress.address2 = newValue;
                break;
            case "billing_address_2":
                order.billingAddress.address2 = newValue;
                break;
            case "shipping_address_1":
                order.defaultShipment.shippingAddress.address1 = newValue;
                break;
            case "billing_address_1":
                order.billingAddress.address1 = newValue;
                break;
            case "shipping_phone":
                order.defaultShipment.shippingAddress.phone = newValue;
                break;
            case "billing_phone":
                order.billingAddress.phone = newValue;
                break;
            case "egc_recipient":
                setGiftCardRecipient(order, newValue);
                break;
            case "email":
                order.setCustomerEmail(newValue);
                break;
        }
    });
}

/**
 * Converts an Order into JSON format for v3 API
 * acceptable on Apruvd side
 *
 * @param {dw.order.Order} order - Order that just have been placed.
 * @return {Object} - json objects describes Order.
 */
function getParams(order) {
    var billingAddress = order.getBillingAddress();
    var shippingAddress = order.getDefaultShipment().shippingAddress;
    var paymentInstrument = order.getPaymentInstruments()[0];
    var ccName = paymentInstrument && paymentInstrument.creditCardHolder ? paymentInstrument.creditCardHolder.split(" ") : [];
    var ccName1 = ccName.length > 0 ? ccName[0] : "";
    var ccName2 = ccName.length > 0 ? ccName[ccName.length - 1] : "";
    var parameters = {
        "mode" : SitePreferences.custom.apruvdMode ? SitePreferences.custom.apruvdMode.value : "",
        "type" : "Ecommerce",
        "total" : order.totalGrossPrice.decimalValue.get(),
        "currency" : order.getCurrencyCode(),
        "order_num" : order.orderNo,
        "ip" : order.remoteHost,
        "email" : order.customerEmail,
        "cc_name" : ccName1,
        "cc_name_2" : ccName2,
        "first_six" : "",                           // Unavailable
        "last_four" : paymentInstrument ? paymentInstrument.creditCardNumberLastDigits  : '',
        "avs": "",                                  // Unavailable
        "cvv": "",                                  // Unavailable
        "auth_attempts": "",
        "billing_first_name" : billingAddress.firstName,
        "billing_last_name" : billingAddress.lastName,
        "billing_address_1" : billingAddress.address1,
        "billing_address_2" : billingAddress.address2,
        "billing_company" : billingAddress.companyName,
        "billing_city" : billingAddress.city,
        "billing_state" : billingAddress.stateCode,
        "billing_postal" : billingAddress.postalCode,
        "billing_region": "",                       // Unavailable
        "billing_country" : billingAddress.countryCode.value,
        "billing_phone" : billingAddress.phone,
        "shipping_email": "",                       // Unavailable
        "shipping_first_name" : shippingAddress.firstName,
        "shipping_last_name" : shippingAddress.lastName,
        "shipping_address_1" : shippingAddress.address1,
        "shipping_address_2" : shippingAddress.address2,
        "shipping_company" : shippingAddress.companyName,
        "shipping_city" : shippingAddress.city,
        "shipping_state" : shippingAddress.stateCode,
        "shipping_postal" : shippingAddress.postalCode,
        "shipping_region": "",
        "shipping_country" : shippingAddress.countryCode.value,
        "shipping_phone" : shippingAddress.phone,
        "shipping_method": shippingMethod.displayName,
        "cart_contents": getProducts(order),
        "discount_codes": getDiscountCodes(order),
        "egc_recipient": giftCardRecipient(order),
        "rep_email": "",
        "additional_1" : "",
        "additional_2" : session.sessionID,
        "additional_3" : "",
    };

    return JSON.stringify(parameters);
}

/**
 * Get saved or fetch new access token if old one is not saved or expired
 *
 * @return {String} accessToken
 */
generateOauthToken = function() {
    var refreshToken = "";
    var accessToken = "";
    var merchantId = SitePreferences.custom.apruvdMerchantId;
    var apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', merchantId);
    if (apruvdTokensCO) {
        var refreshTokenExpiration = apruvdTokensCO.custom.apruvdRefreshTokenExpiration;
        var accessTokenExpiration = apruvdTokensCO.custom.apruvdAccessTokenExpiration;
        var currentDate = new Date();
        if (refreshTokenExpiration > currentDate) {
            refreshToken = apruvdTokensCO.custom.apruvdRefreshToken;
            if (accessTokenExpiration > currentDate) {
                accessToken = apruvdTokensCO.custom.apruvdAccessToken;
            }
        }
    }

    if (empty(refreshToken)) {
        var refreshTokenObj = apruvdService.receiveRefreshToken();
        if (refreshTokenObj) {
            Transaction.wrap(function() {
                apruvdTokensCO = apruvdTokensCO || CustomObjectMgr.createCustomObject('apruvdTokens', merchantId);
                if (refreshTokenObj.token && refreshTokenObj.expires) {
                    apruvdTokensCO.custom.apruvdRefreshToken = refreshTokenObj.token;
                    apruvdTokensCO.custom.apruvdRefreshTokenExpiration = parseDate(refreshTokenObj.expires);
                    // make sure that access token is empty after setting new refresh token
                    accessToken = "";
                }
                if (refreshTokenObj.access && refreshTokenObj.refresh) {
                    var calendar = new Calendar();
                    calendar.add(Calendar.SECOND, refreshTokenObj.access.expires_in);
                    apruvdTokensCO.custom.apruvdAccessToken = refreshTokenObj.access.token;
                    apruvdTokensCO.custom.apruvdAccessTokenExpiration = calendar.getTime();
                    calendar.add(Calendar.SECOND, refreshTokenObj.refresh.expires_in - refreshTokenObj.access.expires_in);
                    apruvdTokensCO.custom.apruvdRefreshToken = refreshTokenObj.refresh.token;
                    apruvdTokensCO.custom.apruvdRefreshTokenExpiration = calendar.getTime();
                    accessToken = apruvdTokensCO.custom.apruvdAccessToken;
                }
            });
            refreshToken = apruvdTokensCO.custom.apruvdRefreshToken;
        }
    }

    if (empty(accessToken) && !empty(refreshToken)) {
        var accessTokenObj = apruvdService.receiveAccessToken({
            refreshToken: refreshToken
        });
        if (accessTokenObj) {
            Transaction.wrap(function() {
                apruvdTokensCO = apruvdTokensCO || CustomObjectMgr.createCustomObject('apruvdTokens', merchantId);
                apruvdTokensCO.custom.apruvdAccessToken = accessTokenObj.token;
                apruvdTokensCO.custom.apruvdAccessTokenExpiration = parseDate(accessTokenObj.expires);
            });
            accessToken = apruvdTokensCO.custom.apruvdAccessToken;
        }
    }
    return accessToken;
}

/**
* Helper function for parsing date format received from apruvd service response
* @param {Date} date
*/
function parseDate(date) {
    var timeZoneOffset = 0;
    // get GMT offset from expected date format, e.g. 2019-03-16T04:19:00.633362-07:00
    var regex = /(?:Z|([+-])(\d{2})(?=:\d{2}))/g;
    var timeZoneSubstrArray = date.match(regex);
    if (timeZoneSubstrArray.length) {
        // remove leading 0 from offset number
        timeZoneOffset = parseInt(timeZoneSubstrArray[0], 10);
    }
    var dateFormat = "yyyy-MM-dd'T'HH:mm:ss";
    var calendar = new Calendar();
    if (timeZoneOffset >= 0) {
        calendar.setTimeZone("GMT+" + timeZoneOffset);
    } else {
        calendar.setTimeZone("GMT" + timeZoneOffset);
    }
    calendar.parseByFormat(date, dateFormat);
    return calendar.getTime();
}

/**
* Gets Gift Card Recipient Information
* @param {dw.order.Order} order
*/
function giftCardRecipient(order) {
    var recipient = "";
    if (order && order.getGiftCertificateLineItems.length) {
        recipient = order.getGiftCertificateLineItems[0].recipientEmail;
    }
    return recipient;
}

/**
* Sets Gift Card Recipient Information
* @param {dw.order.Order} order
* @param {String} newRecipientEmail
*/
function setGiftCardRecipient(order, newRecipientEmail) {
    if (order && order.getGiftCertificateLineItems.length) {
        order.getGiftCertificateLineItems[0].setRecipientEmail(newRecipientEmail);
    }
}

/**
* Gets Discount Code information for SFCC order
* @param {dw.order.Order} order
* @returns {Array} discountCodes
*/
function getDiscountCodes(order) {
    var discountCodes = [];
    var Discount = require('dw/campaign/Discount');
    var couponLineItems = order.getCouponLineItems().iterator();
    while (couponLineItems.hasNext()) {
        var couponLineItem = couponLineItems.next();
        if (couponLineItem.valid) {
            var adjustments = couponLineItem.priceAdjustments.iterator();
            var code = couponLineItem.couponCode;
            while (adjustments.hasNext()) {
                var adjustment = adjustments.next();
                var discount = adjustment.appliedDiscount;
                if (!discount) {
                    break;
                }
                var proratedPrices = adjustment.getProratedPrices().values().iterator();
                var price = 0;
                while (proratedPrices.hasNext()) {
                    price += proratedPrices.next().value;
                }
                var expires = adjustment.getCampaign() ? adjustment.getCampaign().endDate : '';
                var description = adjustment.getCampaign() ? adjustment.getCampaign().description : '';
                var type;
                if ([Discount.TYPE_AMOUNT, Discount.TYPE_FIXED_PRICE, Discount.TYPE_FREE, Discount.TYPE_PRICEBOOK_PRICE, Discount.TYPE_TOTAL_FIXED_PRICE].indexOf(discount.type) >= 0) {
                    type = 'Fixed';
                } else if ([Discount.TYPE_FIXED_PRICE_SHIPPING, Discount.TYPE_FREE_SHIPPING  ].indexOf(discount.type) >= 0) {
                    type = 'Shipping';
                } else if ([Discount.TYPE_PERCENTAGE, Discount.TYPE_PERCENTAGE_OFF_OPTIONS].indexOf(discount.type) >= 0) {
                    type = 'Percent';
                }
                discountCodes.push({
                    code: code,
                    description: description,
                    amount: Math.abs(price),
                    discount_type: type,
                    expires: expires ? expires.toISOString() : null
                });
            }

        }
    }
    return discountCodes;
}

/**
* Gets Products information for SFCC order
* @param {dw.order.Order} order
* @returns {Array} productsArray
*/
function getProducts(order) {
    var URLUtils = require('dw/web/URLUtils');
    var productLineItems = order.getAllProductLineItems();
    var productsArray = [];
    var productLineItemsIterator = productLineItems.iterator();
    while (productLineItemsIterator.hasNext()) {
        var productLineItem = productLineItemsIterator.next();
        if (productLineItem.isBundledProductLineItem() || (productLineItem.isBonusProductLineItem() && !productLineItem.getGrossPrice().valueOrNull) || productLineItem.isOptionProductLineItem()) {
            continue;
        }
        var product = productLineItem.product;
        productsArray.push({
            "item": product.name || "",
            "is_high_risk": !!product.custom.apruvdIsHighRisk,
            "quantity": Number(productLineItem.quantity),
            "extra":{
                "link": URLUtils.https('Product-Show', 'pid', product.ID).toString(),
                "in_stock": product.getAvailabilityModel().inStock
            }
        });
    }
    return productsArray;
}

/**
* Gets initial order status according to merchant settings
* If there are no merchant settings, fetch from Apruvd service
* @returns {String} status
*/
function getStatus() {
    var merchantId = SitePreferences.custom.apruvdMerchantId;
    var apruvdTokensCO;
    Transaction.wrap(function() {
        apruvdTokensCO = CustomObjectMgr.getCustomObject('apruvdTokens', merchantId) || CustomObjectMgr.createCustomObject('apruvdTokens', merchantId);
    });
    if (apruvdTokensCO.custom.apruvdDataConnection === null) {
        var merchantSettings = apruvdService.getMerchantSettings({
            accessToken: apruvdTokensCO.custom.apruvdAccessToken
        });
        if (merchantSettings) {
            processMerchantSettings(merchantSettings);
        }
    }
    return apruvdTokensCO.custom.apruvdDataConnection ? 'Submitted' : 'Reviewing';
}

/**
* Checks if order contains payment instruments that are guaranteed
* and don't need apruvd fraud check
* @param {dw.order.Order} order
* @returns {boolean} containsIndemnifiedPaymentMethods
*/
function hasAlreadyIndemnifiedTransactions(order) {
    var containsIndemnifiedPaymentMethods = false;
    var indemnifiedPaymentMethods = SitePreferences.custom.apruvdIndemnifiedPaymentMethods;
    for (var i = 0; i < indemnifiedPaymentMethods.length; i++) {
        var paymentInstrumentsCollection = order.getPaymentInstruments(indemnifiedPaymentMethods[i]);
        if (paymentInstrumentsCollection && !paymentInstrumentsCollection.empty) {
            containsIndemnifiedPaymentMethods = true;
            break;
        }
    }
    return containsIndemnifiedPaymentMethods;
}

exports.createTransaction = createTransaction;
exports.getTransaction = getTransaction;
exports.partialUpdate = partialUpdate;
exports.isElevateAvailable = isElevateAvailable;
exports.isTrainingData = isTrainingData;
exports.renderHeaderScript = renderHeaderScript;
exports.processMerchantSettings = processMerchantSettings;
exports.validateWebHook = validateWebHook;
exports.processReviewComplete = processReviewComplete;
exports.resubmitTransaction = resubmitTransaction;
exports.getPageId = getPageId;
exports.isSendTransaction = isSendTransaction;
