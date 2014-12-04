var Bus = require('./bus');
var chrome = require('./chrome');

function getEnd(chrome) {
    return (typeof chrome.tabs !== 'undefined') ? 'main' : 'content';
}

var buses = {};

module.exports = {
    init: function (options) {
        options = options || {};
        var end = options.end || getEnd(chrome);
        var bus = buses[end];
        if (!bus) bus = buses[end] = new Bus(end, options);
        return bus;
    }
};