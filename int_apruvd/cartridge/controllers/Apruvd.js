/**
 * Apruvd controller.
 *
 * @module controllers/Apruvd
 *
*/
var apruvd = require('*/cartridge/scripts/service/apruvd');

/**
 * Gets client site script to template
 */
function getScript(){
    var template = (request.httpParameterMap.tag.value !== 'noscript') ? 'apruvdScriptTag' : 'apruvdNoscriptTag';
    require('dw/template/ISML').renderTemplate(template, {
        pageId: request.httpParameterMap.pageId.value
    });
}

/**
 * Gets merchant settings
 * to be triggered by Apruvd
 */
function getMerchantSettings(){
    var responseObj = {
        success: false
    }
    if (request.isHttpSecure() && request.httpMethod === 'POST' && apruvd.validateWebHook(request.getHttpHeaders())) {
        var stringBody = request.httpParameterMap.getRequestBodyAsString();
        var body = JSON.parse(stringBody);
        apruvd.processMerchantSettings(body);
        responseObj.success = true;
    } else {
        // unauthorized 
        response.setStatus(401);
    }
    require('dw/template/ISML').renderTemplate('jsonresponse', {
        json: JSON.stringify(responseObj)
    });
}

/**
 * Review Complete
 * to be triggered by Apruvd
 */
function reviewComplete(){
    var responseObj = {
        success: false
    }
    if (request.isHttpSecure() && request.httpMethod === 'POST' && apruvd.validateWebHook(request.getHttpHeaders())) {
        var stringBody = request.httpParameterMap.getRequestBodyAsString();
        var body = JSON.parse(stringBody);
        apruvd.processReviewComplete(body);
        responseObj.success = true;
    } else {
        // unauthorized 
        response.setStatus(401);
    }
    require('dw/template/ISML').renderTemplate('jsonresponse', {
        json: JSON.stringify(responseObj)
    });
}

exports.ReviewComplete = reviewComplete;
exports.ReviewComplete.public = true; 

exports.GetMerchantSettings = getMerchantSettings;
exports.GetMerchantSettings.public = true; 

exports.GetScript = getScript;
exports.GetScript.public = true; 