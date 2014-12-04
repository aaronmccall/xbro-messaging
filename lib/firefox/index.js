var Bus = require('./bus');
var self = require('./self');

function getEnd(self) {
    return (typeof self.port === 'object' && typeof self.port.emit === 'function') ? 'content' : 'main';
}

var buses = {};

module.exports = {
    init: function (options) {
        options = options || {};
        var end = options.end || getEnd(self);
        var bus = buses[end];
        if (!bus) buses[end] = new Bus(end, options);
        return bus;
    }
};