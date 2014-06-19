var Bus = require('./bus');
var end = typeof chrome === 'object' && typeof chrome.tabs !== 'undefined' ? 'main' : 'content';

module.exports = {
    init: function (options) {
        return Bus.init(end, options);
    }
}