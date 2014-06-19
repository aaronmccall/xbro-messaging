var util = require('util');
var WildEmitter = require('wildemitter');
var objectPath = require('object-path').get;

function idResolver(port) {
    return objectPath.get(port, ['sender', 'tab', 'id']);
}

util.inherits(Socket, WildEmitter);

function Socket(channel, options) {
    options = options || {};
    WildEmitter.call(this);
    this.channel = channel;
    this._ports = options.ports||[];
    this._streams = [];
    this.initialize();
}

Socket.prototype.initialize = function() {
    this._ports.forEach(this._initPort.bind(this));
    this.on('closing', function () {
        this.on('disconnect', function () {
            this.emit('closed');
        }.bind(this));
    }.bind(this));
    this._initStreamHandlers();
    return this;
};

Socket.prototype.addPort = function(port) {
    if (this._ports.indexOf(port) < 0) {
        this._ports.push(port);
        this.emit('portConnected', port);
    }
};

Socket.prototype.send = function(payload, id) {
    this._getPorts(id).forEach(this._sendToPort.bind(this, payload, null));
};

Socket.prototype.error = function(err, id) {
    if (!id && 'number' === typeof payload) {
        id = payload;
        payload = null;
    }
    this._getPorts(id).forEach(this._sendToPort.bind(this, null, err));
};

Socket.prototype.pipe = function(stream, tabId) {
   highland(function (push, next) {
         this._streams.push({push: push, next: next, tab: tabId});
    }.bind(this));
};

Socket.prototype._getPorts = function(id) {
    if (!id) return this._ports;
    return this._ports.filter(function (port) {
        return  idResolver(port) === id;
    });
};

Socket.prototype._getStreams = function(id) {
    if (id == null) return this.streams;
    return this.streams.filter(function (stream) {
        if (stream.id == null) return true;
        return  stream.id === id;
    });
};

Socket.prototype._sendToPort = function(payload, err, port) {
    port.postMessage({ payload: payload, error: err });
};

Socket.prototype._initPort = function(port) {
    port.onDisconnect(this._handleDisconnect.bind(this, port));
    port.onMessage.addListener(this._handleMessage.bind(this, idResolver(port)));
};

Socket.prototype._initStreamHandlers = function() {
    this.on('data', function (data, id) {
        this._getStreams(id).forEach(function (stream) {
            stream.push(null, data);
            stream.next();
        });
    });
    this.on('error', function (err, id) {
        this._getStreams(id).forEach(function (stream) {
            stream.push(err);
            stream.next();
        });
    });
    this.on('closed', function () {
        this._getStreams().forEach(function (stream) {
            stream.push(highland.nil);
        });
    });
};

Socket.prototype._handleDisconnect = function(port) {
    var idx = this._ports.indexOf(port);
    if (idx > -1) this._ports.splice(idx, 1);
    this.emit('disconnect', idResolver(port));
};

Socket.prototype._handleMessage = function(tabId, msg) {
    if (msg.close) this.emit('closing');
    if (msg.payload) this.emit('data', msg.payload, tabId);
    if (msg.error) this.emit('error', msg.error, tabId);
};