var async = require('async');
var util = require('util');
var chrome = require('./chrome');
var Base = require('../shared/bus');
var Socket = require('./socket');
var callIfFunc = require('../shared/callIfFunc');

var counter = 1;

util.inherits(Bus, Base);

function Bus(end, options) {
    Base.call(this, end, options);
}

Bus.prototype._socketConstructor = Socket;

Bus.prototype.initialize = function() {
    this._sender = (this.end === 'main') ? this._senderFromMain : this._senderFromContent;
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


Bus.prototype._connectFromContent = function(channel, listener) {
    return this._handleConnect(channel, chrome.runtime.connect({name: channel}), listener);
};

Bus.prototype._connectFromMain = function(channel, listener, query) {
    var socket = this._handleConnect(channel, null, listener);
    this._resolveTabs(query, function (tabs) {
        tabs.forEach(function (tab) {
            socket.addPort(tab.connect({name: channel}));
        });
    });
    return socket;
};

Bus.prototype._sendFromContent = function(channel, payload, cb) {
    var msg = this._buildMessage(channel, payload);
    chrome.runtime.sendMessage(msg, function (response) {
        this.emit(channel + ':' + msg.id, response);
        callIfFunc(cb, response.error, response.payload);
    });
};

Bus.prototype._sendFromMain = function(channel, payload, cb, tabQuery) {
    this._resolveTabs(tabQuery, function (tabs) {
        var msg = this._buildMessage(channel, payload);
        if (tabs.length === 1) {
            var id = tab[0].id;
            chrome.tabs.sendMessage(id, msg, function (response) {
                this.emit(channel + ':' + msg.id, response, id);
                callIfFunc(cb, [{response: response, tab: id}]);
            });
        }
        async.map(tabs, function (tab, next) {
            chrome.tabs.sendMessage(tab.id, msg, function (response) {
                this.emit(channel + ':' + msg.id, response, tab.id);
                next(null, {response: response, tab: tab.id});
            });
        }, function (err, results) { callIfFunc(cb, results); });
    });
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
            case 'number':
                return next([{id: query}]);
        }
    }
    chrome.tabs.query(tabQuery, function (tabs) {
        if (tabs.length && filter) {
            tabs = tabs.filter(filter);
        }
        next(tabs);
    });
};

module.exports = Bus;
