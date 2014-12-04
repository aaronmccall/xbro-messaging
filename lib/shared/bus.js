var async = require('async');
var util = require('util');
var WildEmitter = require('wildemitter');

var counter = 1;

util.inherits(Bus, WildEmitter);

function Bus(end, options) {
    WildEmitter.call(this);
    this.end = end;
    this.options = options || {};
    this.initialize();
    this.sockets = this.options.sockets || {};
}

Bus.prototype.send = function(channel, payload, cb, query) {
    this._sender(channel, payload, cb, query);
};

Bus.prototype.connect = function(channel, listener, query) {
    this._connector(channel, listener, query);
};

Bus.prototype.initialize = function () {};

Bus.prototype._handleConnect = function(channel, port, listener) {
    var socket = this.sockets[channel];
    if (!socket) {
        socket = this._addSocket(channel);
    }
    if (port) socket.addPort(port);
    if (listener) socket.on('*', listener);
    return socket;
};

Bus.prototype._addSocket = function(channel) {
    var socket = this.sockets[channel] = new this._socketConstructor(channel);
    return socket;
};

Bus.prototype._buildMessage = function(channel, payload) {
    return {
        channel: channel,
        payload: payload,
        id: this.end + ':' + (counter++)
    };
};

module.exports = Bus;
