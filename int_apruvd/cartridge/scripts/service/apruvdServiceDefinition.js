'use strict';
var StringUtils = require('dw/util/StringUtils');
var SitePreferences = require('dw/system/Site').current.preferences;

var receiveRefreshToken = {
    createRequest : function(service, params) {
        var apiKey = SitePreferences.custom.apruvdApiKeyId;
        var clientSecret = SitePreferences.custom.apruvdApiKeySecret;

        service.setRequestMethod('POST');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(apiKey + ':' + clientSecret));

        service.setURL(service.getURL() + '/accounts/merchants/oauth_20/');
        return '';
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

var receiveAccessToken = {
    createRequest : function(service, params) {
        var refreshToken = params.refreshToken;

        service.setRequestMethod('POST');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('Authorization', 'Bearer ' + refreshToken);

        service.setURL(service.getURL() + '/accounts/merchants/access_tokens/');
        return '';
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

var createTransaction = {
    createRequest : function(service, params) {
        var accessToken = params.accessToken;
        service.setCredentialID("apruvd.REST.service.v3.credentials");
        service.setRequestMethod('POST');
        service.addHeader("accept", "application/json");
        service.addHeader("content-type", "application/json");
        service.addHeader('Authorization', 'Basic ' + accessToken);
        service.setURL(service.getURL() + '/api/transactions/submit/');
        return params.requestBody;
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

var getTransaction = {
    createRequest : function(service, params) {
        var accessToken = params.accessToken;

        service.setRequestMethod('GET');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('Authorization', 'Bearer ' + accessToken);

        service.setURL(service.getURL() + '/transactions/by_order_id/' + params.orderId + '/');
        return JSON.stringify({});
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

var getMerchantSettings = {
    createRequest : function(service, params) {
        var accessToken = params.accessToken;

        service.setRequestMethod('GET');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('Authorization', 'Bearer ' + accessToken);

        service.setURL(service.getURL() + '/accounts/merchants/' + SitePreferences.custom.apruvdMerchantId);
        return JSON.stringify({});
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

var partialUpdate = {
    createRequest : function(service, params) {
        var accessToken = params.accessToken;

        service.setRequestMethod('PATCH');
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('Authorization', 'Bearer ' + accessToken);

        service.setURL(service.getURL() + '/transactions/by_order_id/' + params.orderNumber + '/');
        return JSON.stringify({
            "status": params.status
        });
    },
    parseResponse : function(service, response) {
        return getResponse(response);
    },
    filterLogMessage: function(msg) {
        return msg;
    },
    getRequestLogMessage: function(request) {
		return request;
	},
	getResponseLogMessage: function(response) {
		return response.text;
	},
    mockFull : function() {
        return {
        };
    }
};

function getResponse(response) {
    return response ? response.text : null;
}

module.exports = {
    receiveRefreshToken: receiveRefreshToken,
    receiveAccessToken: receiveAccessToken,
    createTransaction: createTransaction,
    getMerchantSettings: getMerchantSettings,
    partialUpdate: partialUpdate,
    getTransaction: getTransaction
};
