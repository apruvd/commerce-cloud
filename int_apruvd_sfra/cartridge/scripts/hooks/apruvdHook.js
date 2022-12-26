'use strict';

exports.htmlHead = function() {
    require('*/cartridge/scripts/service/apruvd').renderHeaderScript(request.session.clickStream.last.pipelineName);
}
exports.afterFooter = function() {
    require('*/cartridge/scripts/service/apruvd').renderHeaderScript(request.session.clickStream.last.pipelineName, 'noscript');
}
