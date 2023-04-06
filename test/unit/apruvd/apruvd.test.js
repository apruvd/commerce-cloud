const assert = require("assert");
const chai = require("chai");
const proxyquire = require("proxyquire").noCallThru();
var apruvdPath = "../../../int_apruvd/cartridge/scripts/service/apruvd.js";

var proxyquireStubs = {
	transaction: {
		wrap: function (callBack) {
			return callBack.call();
		},
		begin: function () { },
		commit: function () { }
	},
	session : {
		sessionID: "assertionData",
		privacy: {}
	},
    tempValue: {},
    Site: {
		current: {
			preferences: {
				custom: {
					apruvdIndemnifiedPaymentMethods: []
				}
			}
		},
        getCurrent: function() {
            return {
                getName: function() {
                    return "name";
                }
            };
        }
    },
    ProductMgr: {
        getProduct: function(param) {
            if (param === "isProduct") {
                return {
                    variants: { dummyKey1: { ID: "productIdentifier", availabilityModel: { inStock: true } } }
                };
            }
            return null;
        }
    },
	Calendar: function() {
		return {};
	},
	StringUtils: {
		formatCalendar: function() {
			return "assertionData"
		},
		encodeBase64: function() {
			return "assertionData"
		}
	},
	CustomObjectMgr: {
		getCustomObject: function() {
			return {
				custom: {
					apruvdDataConnection: true
				}
			};
		}
	},
	URLUtils: {

	}
};

global.session = proxyquireStubs.session;
global.empty = function() {
	return false;
}

var createTransactionSuccess;
var proxyquireObject = {
    "dw/order/Order": proxyquireStubs.tempValue,
    "dw/order/BasketMgr": proxyquireStubs.tempValue,
    "dw/order/OrderMgr": proxyquireStubs.tempValue,
    "dw/order/PaymentMgr": proxyquireStubs.tempValue,
    "dw/catalog/ProductMgr": proxyquireStubs.ProductMgr,
    "dw/util/Calendar": proxyquireStubs.Calendar,
    "dw/system/Site": proxyquireStubs.Site,
    "dw/system/Status": proxyquireStubs.tempValue,
    "dw/system/Transaction": proxyquireStubs.transaction,
    "dw/web/Resource": proxyquireStubs.tempValue,
    "dw/web/URLUtils": proxyquireStubs.URLUtils,
    "dw/util/Decimal": proxyquireStubs.tempValue,
    "dw/util/Currency": proxyquireStubs.tempValue,
    "dw/crypto/Cipher": proxyquireStubs.tempValue,
    "dw/customer/CustomerMgr": proxyquireStubs.tempValue,
    "dw/campaign/CouponMgr": proxyquireStubs.tempValue,
    "dw/value/Money": proxyquireStubs.tempValue,
    "dw/util/Template": proxyquireStubs.tempValue,
    "dw/object/CustomObjectMgr": proxyquireStubs.CustomObjectMgr,
    "dw/util/StringUtils": proxyquireStubs.StringUtils,
    "dw/order/GiftCertificate": proxyquireStubs.tempValue,
    "dw/order/GiftCertificateStatusCodes": proxyquireStubs.tempValue,
    "dw/campaign/Discount": proxyquireStubs.tempValue,
    "dw/util/ArrayList": proxyquireStubs.tempValue,
	"*/cartridge/scripts/service/apruvdService": {
		createTransaction: function(params) {
			var requestBody = (typeof params.requestBody === 'string' || params.requestBody instanceof String) ? JSON.parse(params.requestBody) : params.requestBody;
			var createTransactionResult = '';
			if (createTransactionSuccess) {
				createTransactionResult = {
					"transaction_id": 448920124,
					"status": "Reviewing",
					"risk_grade": "A+",
					"order_num": requestBody.order_num || requestBody.order_id
				};
			} else {
				createTransactionResult = {
					"error": "true",
					"errorMessage": "Error message"
				};
			}
			return createTransactionResult;
		},
		getTransaction: function(params) {
			var getTransactionResult = '';
			if (createTransactionSuccess) {
				getTransactionResult = {
					"transaction_id": 448920124,
					"status": "Reviewing",
					"risk_grade": "A+",
					"order_num": params.orderId
				};
			} else {
				getTransactionResult = {
					"error": "true",
					"errorMessage": "Error message"
				};
			}
			return getTransactionResult;
		},
		partialUpdate: function(params) {
			var partialUpdateResult = '';
			partialUpdateResult = {
				status: "Reviewing"
			};
			return partialUpdateResult;
		}
	}
};



describe("Apruvd Tests", function() {
    var apruvd = proxyquire(apruvdPath, proxyquireObject);
	var order = {
		orderNo: "assertionData",
		defaultShipment: {
			shippingAddress: {
				countryCode: {
					value: "assertionData"
				},
				stateCode: {
					value: "assertionData"
				}
			}
		},
		billingAddress: {
			countryCode: {
				value: "assertionData"
			},
			stateCode: {
				value: "assertionData"
			}
		},
		getPaymentInstruments: function() {
			return [{
					getPaymentTransaction: function(){
						return {
							getPaymentInstrument: function() {
								return {}
							}
						};
					}
			}]
		},
		totalGrossPrice: {
			decimalValue: {
				get: function() {
					return "assertionData"
				}
			}
		},
		getCurrencyCode: function() {
			return "assertionData"
		},
		getCustomerNo: function() {
			return "assertionData"
		},
		getCustomerEmail: function() {
			return "assertionData"
		},
		getBillingAddress: function() {
			return {
				countryCode: {
				value: "assertionData"
				},
				stateCode: {
					value: "assertionData"
				}
			}
		},
		getGiftCertificateLineItems: {
			length: 0
		},
		getTotalGrossPrice: function() {
			return {
				value: "assertionData"
			}
		},
		getAdjustedShippingTotalGrossPrice: function() {
			return {
				value: "assertionData"
			}
		},
		getCouponLineItems: function() {
			return {
				iterator: function() {
					return {
						hasNext: function() {
							return false
						}
					}
				}
			}
		},
		getAllProductLineItems: function() {
			return {
				iterator: function() {
					return {
						hasNext: function() {
							return false
						}
					}
				}
			}
		},
		currentOrderNo: "assertionData",
		custom: {
			apruvdStatus: ""
		}
	};

	describe("V3 createTransaction", function() {
		createTransactionSuccess = true;
        var result = apruvd.createTransaction(order);
		it("Transaction ID is received", function() {
			assert.ok(result.transaction_id);
        });
        it("Order number in response is the same as the one in request", function() {
			assert.equal(result.order_num, order.orderNo);
        });
		it("Transaction status is received", function() {
			assert.ok(result.status);
        });
    });

	describe("V3 getTransaction", function() {
		createTransactionSuccess = true;
        var result = apruvd.getTransaction(order);
		it("Apruvd status on order level is set", function() {
			assert.ok(order.custom.apruvdStatus);
        });
    });

	describe("V3 resubmitTransaction", function() {
		createTransactionSuccess = true;
        var result = apruvd.resubmitTransaction(order);
		it("Transaction ID is received", function() {
			assert.ok(result.transaction_id);
        });
        it("Order number in response is the same as the one in request", function() {
			assert.equal(result.order_num, order.orderNo);
        });
		it("Transaction status is received", function() {
			assert.ok(result.status);
        });
    });
	describe("V3 partialUpdate", function() {
		createTransactionSuccess = true;
		order.custom.apruvdStatus = 'Submitted';
        var result = apruvd.partialUpdate(order);
		it("After elevate, status is 'Reviewing'", function() {
			assert.equal(order.custom.apruvdStatus, 'Reviewing');
        });
    });
});
