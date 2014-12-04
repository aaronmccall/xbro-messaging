var async = require('async');
var util = require('util');
var moz = require('./self');
var Base = require('../shared/bus');
var Socket = require('./socket');
var callIfFunc = require('../shared/callIfFunc');
// var tabs = _mzreq_('sdk/tabs');

var counter = 1;

util.inherits(Bus, Base);

function Bus(end, options) {
    Base.call(this, end, options);
}

Bus.prototype.initialize = function() {
    this.workers = this.options.workers || [];
    this._sender = (this.end === 'main') ? this._senderFromMain : this._senderFromContent;
    this._connector = (this.end === 'main') ? this._connectFromMain : this._connectFromContent;
    if (this.end === 'main') {
        this.workers.forEach(this._initWorker.bind(this));
    } else {
        if (moz.on) {
            var msgHandler = this._handleMessage.bind(this, moz);
            moz.on('message', msgHandler);
            moz.on('__xbro-message__', msgHandler);
            moz.on('__xbro-socket__', this._socketHandler.bind(this, moz));
        }
    }
};

Bus.prototype._socketConstructor = Socket;

Bus.prototype._addWorker = function(worker) {
    this.workers.push(worker);
    this._initWorker(worker);
};

Bus.prototype._initWorker = function (worker) {
    var msgHandler = this._handleMessage.bind(this, worker);
    worker.on('message', msgHandler);
    worker.on('__xbro-message__', msgHandler);
    worker.on('__xbro-socket__', this._socketHandler.bind(this, worker));
    worker.tab.on('activate', this._updateActive.bind(this, worker));
};

Bus.prototype._socketHandler = function(worker, packet) {
    if (!packet.channel) return;
    if (packet.connect) {
        var channel = packet.channel;
        var socket = this._sockets[channel];
        if (!socket) {
            socket = this._sockets[channel] = new Socket(channel);
        }
        socket.addPort(worker.port);
    }
    if (packet.disconnect) {

    }
};

Bus.prototype._handleMessage = function(worker, msg) {
    if (!msg.reply) {
        this.emit(msg.channel, msg.payload, function (payload) {
            msg.payload = payload;
            msg.reply = true;
            worker.postMessage(msg);
        });
    } else {
        this.emit('message:' + msg.id, msg.payload);
    }
};

Bus.prototype._connectFromContent = function(channel, listener) {
    if (typeof worker === 'function' && arguments.length === 2) {
        listener = worker;
        worker = null;
    }
    moz.port.emit('__xbro-socket__', {channel: channel, connect: true});
};

Bus.prototype._connectFromMain = function(channel, worker, listener) {
    // do stuff
};

Bus.prototype._sendFromContent = function(channel, payload, cb) {
    var msg = this._buildMessage(channel, payload);
    this._listenForReply(msg, cb);
    if (moz.port) {
        moz.port.emit('__xbro-message__', msg);
    } else {
        moz.postMessage(msg);
    }
};

Bus.prototype._sendFromMain = function(channel, payload, cb, tabQuery) {
    if ('object' === typeof cb && arguments.length === 3) {
        tabQuery = cb;
    }
    if ('function' === typeof payload) {
        cb = payload;
        payload = null;
    }
    var msg = this._buildMessage(channel, payload);
    this._listenForReply(msg, cb);
};


Bus.prototype._listenForReply = function(msg, cb) {
    this.once('message:' + msg.id, function (payload) {
        cb(payload);
    });
};

Bus.prototype._updateActive = function(worker) {
    this.activeWorker = worker;
};

module.exports = Bus;