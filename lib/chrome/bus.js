var async = require('async');
var chrome = require('./chrome');
var util = require('util');
var WildEmitter = require('wildemitter');
var Socket = require('./socket');

var counter = 1;

function callIfFunc(fn) {
    if ('function' !== typeof fn) return;
    var args = Array.prototype.slice(arguments, 1);
    return fn.apply(null, args);
}

util.inherits(Bus, WildEmitter);

function Bus(end, options) {
    WildEmitter.call(this);
    this.end = end;
    this.options = options;
    this.initialize();
    this._connected = [];
    this.sockets = {};
}

Bus.prototype.message = function(channel, payload, cb, query) {
    this._sendMessage.apply(this, arguments);
};

Bus.prototype.connect = function(channel, listener, query) {
    this._connector.apply(this, arguments);
};

Bus.prototype.send = function (channel, payload, query) {
    this._sender.apply(this, arguments);
};

Bus.prototype.initialize = function() {
    this._handler = ((this.end === 'main') ? this._handleMessageMain : this._handleMessageContent).bind(this);
    this._sendMessage = (this.end === 'main') ? this._sendMessageFromMain : this._sendMessageFromContent;
    this._connector = (this.end === 'main') ? this._connectFromMain : this._connectFromContent;
    chrome.runtime.onMessage.addListener(function(msg, sender, reply) {
        this.emit(msg.channel, msg.payload, reply);
    });
    chrome.runtime.onConnect.addListener(function (port) {
        if (!port.name) return;
        this.emit('connect', port.name, port);
    }.bind(this));
    this.on('connect', this._handleConnect.bind(this));
};

Bus.prototype._handleConnect = function(channel, port, listener) {
    var socket = this.sockets[channel];
    if (socket) {
        return socket.addPort(port);
    } else {
        socket = this.sockets[channel] = new Socket(channel);
        if (port) socket.addPort(port);
        if (listener) {
            socket.on('*', listener);
        }
        return socket;
    }
};

Bus.prototype._connectFromContent = function(channel, listener) {
    return this._handleConnect(channel, chrome.runtime.connect({name: channel}), listener);
};

Bus.prototype._connectFromMain = function(channel, listener, query) {
    var socket = this._handleConnect(channel, null, listener);
    this._resolveTabs(query, function (tabs) {
        tabs.map(function (tab) {
            socket.addPort(tab.connect({name: channel}));
        });
    });
    return socket;
};

Bus.prototype._sendMessageFromContent = function(channel, payload, cb) {
    var msg = this._buildMessage(channel, payload);
    chrome.runtime.sendMessage(msg, function (response) {
        this.emit(channel + ':' + msg.id, response);
        callIfFunc(cb, response.error, response.payload);
    });
};

Bus.prototype._sendMessageFromMain = function(channel, payload, cb, tabQuery) {
    this._resolveTabs(tabQuery, function (tabs) {
        var msg = this._buildMessage(channel, payload);
        if (tabs.length === 1) {
            chrome.tabs.sendMessage(tab.id, msg, function (response) {
                this.emit(channel + ':' + msg.id, response, tab.id);
                callIfFunc(cb, [{response: response, tab: tab.id}]);
            });
        }
        async.map(tabs, function (tab, next) {
            chrome.tabs.sendMessage(tab.id, msg, function (response) {
                this.emit(channel + ':' + msg.id, response, tab.id);
                next(null, {response: response, tab: tab.id});
            });
        }, function (err, results) {
            callIfFunc(cb, results);
        });
    });
};

Bus.prototype._buildMessage = function(channel, payload) {
    return {
        channel: channel,
        payload: payload,
        id: this.end + ':' + (counter++)
    };
};

Bus.prototype._resolveTabs = function(query, next) {
    var tabQuery = {
        url: this.options.include
    };
    var filter;
    if (query) {
        switch (typeof query) {
            case 'string':
                switch (query) {

                    case 'active':
                        tabQuery.active = true;
                    break;

                    case 'active-current':
                        tabQuery.active = true;
                        tabQuery.currentWindow = true;
                    break;

                    case 'current':
                        tabQuery.currentWindow = true;
                    break;
                }
                break;
            case 'object':
                tabQuery = query;
            break;
            case 'function':
                filter = query;
            break;
        }
    }
    chrome.tabs.query(tabQuery, function (tabs) {
        if (tabs.length && filter) {
            tabs = tabs.filter(filter);
        }
        next(tabs);
    });
};

var bus;

module.exports = {
    init: function (end, options) {
        if (options.chrome) chrome = options.chrome;
        if (!bus) {
            bus = new Bus(end, options);
        }
        return bus;
    }
};
