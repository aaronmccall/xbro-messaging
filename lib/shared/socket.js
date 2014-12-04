var util = require('util');
var WildEmitter = require('wildemitter');

util.inherits(Socket, WildEmitter);

function Socket(channel, options) {
    WildEmitter.call(this);
    this.options = options || {};
    this.channel = channel;
    this._ports = this.options.ports || [];
    this.initialize();
}

Socket.prototype.initialize = function() {};

Socket.prototype.addPort = function(port) {
    if (this._ports.indexOf(port) < 0) {
        this._ports.push(port);
        this.emit('portConnected', port);
    }
};

module.exports = Socket;