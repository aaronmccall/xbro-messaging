var util = require('util');
var BaseSocket = require('../shared/socket');
var objectPath = require('object-path').get;

util.inherits(Socket, BaseSocket);

function Socket(channel, options) {
    BaseSocket.call(this, channel, options);
}

Socket.prototype.initialize = function() {
    this._ports.forEach(this._initPort.bind(this));
    this.on('closing', function () {
        this.on('disconnect', function () {
            if (this._ports.length === 0) this.emit('closed');
        }.bind(this));
    }.bind(this));
    return this;
};

Socket.prototype.send = function(payload, id) {
    this._getPorts(id).forEach(this._sendToPort.bind(this, payload, null));
};

Socket.prototype.error = function(err, id) {
    this._getPorts(id).forEach(this._sendToPort.bind(this, null, err));
};

Socket.prototype._getPorts = function(id) {
    if (!id) return this._ports;
    return this._ports.filter(function (port) {
        return  idResolver(port) === id;
    });
};

Socket.prototype._sendToPort = function(payload, err, port) {
    port.emit('__xbro-socket__', { channel: this.channel, payload: payload, error: err });
};

Socket.prototype._initPort = function(port) {
    port.onDisconnect(this._handleDisconnect.bind(this, port));
    port.onMessage.addListener(this._handleMessage.bind(this, idResolver(port)));
};

Socket.prototype._handleDisconnect = function(port) {
    var idx = this._ports.indexOf(port);
    if (idx > -1) this._ports.splice(idx, 1);
    this.emit('disconnect', idResolver(port));
};

Socket.prototype._handleMessage = function(tabId, msg) {
    if (msg.close) this.emit('closing', tabId);
    if (msg.payload) this.emit('data', msg.payload, tabId);
    if (msg.error) this.emit('error', msg.error, tabId);
};