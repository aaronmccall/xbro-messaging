var _ = require('lodash-node');
var Lab = require('lab');
var sinon = require('sinon');
var expect = require('code').expect;
var lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;

var Bus = require('../lib/shared/bus');
var Socket = require('../lib/shared/socket');

function wrapDone(fn) {
    return function(done) {
        fn();
        done && done();
    };
}

describe('base Bus implementation', function () {
    describe('constructor', function () {
        var bus, init;
        beforeEach(wrapDone(function () {
            init = sinon.spy(Bus.prototype, "initialize");
            bus = new Bus('main');
        }));
        afterEach(wrapDone(function () {
            init.restore();
        }));
        it('sets end property', wrapDone(function () {
            expect(bus.end).to.equal('main');
        }));
        it('sets options property', wrapDone(function () {
            var bus2 = new Bus('content', {foo: 'bar'});
            expect(bus.options).to.be.an.object().and.to.deep.equal({});
            expect(bus2.options).to.be.an.object().and.to.deep.equal({foo: 'bar'});
        }));
        it('calls initialize', wrapDone(function () {
            expect(init.called).to.equal(true);
            init.restore();
        }));
        it('sets sockets property to empty object if not in options', wrapDone(function () {
            expect(bus.sockets).to.be.an.object().and.to.deep.equal({});
        }));
        it('sets sockets property from options', wrapDone(function () {
            var options = {sockets: {foo: {}}};
            var bus2 = new Bus('main', options);
            expect(bus.sockets).to.be.an.object().and.to.deep.equal(options.sockets);
        }));
    });
    describe('connect', function () {
        it('calls _connector', wrapDone(function () {
            var bus = new Bus('main');
            bus._connector = sinon.spy();
            var channel = 'foo';
            var listener = function () {};
            var query = {};
            bus.connect(channel, listener, query);
            expect(bus._connector.called).to.equal(true);
            expect(bus._connector.getCall(0).args).to.deep.equal([channel, listener, query]);
        }));
    });

    describe('send', function () {
        it('calls _sender', wrapDone(function () {
            var bus = new Bus('main');
            bus._sender = sinon.spy();
            var channel = 'foo';
            var payload = {};
            var listener = function () {};
            var query = {};
            bus.send(channel, payload, listener, query);
            expect(bus._sender.called).to.equal(true);
            expect(bus._sender.getCall(0).args).to.deep.equal([channel, payload, listener, query]);
        }));
    });

    describe('_handleConnect', function () {
        var bus;
        var channel = 'foo';
        var port = {};
        var listener = function () {};
        beforeEach(wrapDone(function () {
            bus = new Bus('main');
            bus._socketConstructor = sinon.spy(Socket);
        }));
        it('creates a socket for new channels', wrapDone(function () {
            expect(bus.sockets.foo).to.not.exist();
            var socket = bus._handleConnect(channel);
            expect(bus.sockets.foo).to.exist();
            expect(bus.sockets.foo).to.equal(socket);
        }));
        it('calls _addSocket when creating new sockets', wrapDone(function () {
            var add = sinon.spy(bus, '_addSocket');
            var socket = bus._handleConnect(channel);
            expect(add.called).to.equal(true);
            add.restore();
        }));
        it('gets socket for existing channels', wrapDone(function () {
            var socket = bus._handleConnect(channel);
            var socket2 = bus._handleConnect(channel, port);
            expect(socket2).to.equal(socket);
        }));
        it('adds port to socket', wrapDone(function () {
            var socket = bus._handleConnect(channel, port);
            expect(socket._ports[0]).to.equal(port);
        }));
        it('subscribes listener to "*" on socket', wrapDone(function () {
            var socket = bus._handleConnect(channel, port, listener);
            expect(socket.callbacks["*"].indexOf(listener)).to.be.above(-1);
        }));
    });

    describe('_addSocket', function () {
        it('creates new sockets from _socketConstructor', wrapDone(function () {
            var bus = new Bus('main');
            bus._socketConstructor = sinon.spy(Socket);
            bus._addSocket('foo');
            expect(bus._socketConstructor.calledWithNew()).to.equal(true);
            expect(bus._socketConstructor.calledWith('foo')).to.equal(true);
        }));
    });

    describe('_buildMessage', function () {
        it('returns an object', wrapDone(function () {
            var bus = new Bus('main');
            var channel = 'foo';
            var payload = {};
            var msg = bus._buildMessage(channel, payload);
            expect(msg).to.be.an.object().and.to.deep.include({
                channel: channel,
                payload: payload
            });
            expect(msg.id).to.match(/main:\d+/);
        }));
        it('increment the id number', wrapDone(function () {
            var bus = new Bus('main');
            var msg = bus._buildMessage('foo', {});
            var msg2 = bus._buildMessage('bar', {});
            expect(Number(msg2.id.split(':').pop())).to.be.above(Number(msg.id.split(':').pop()));
        }));
    });
});

exports.lab = lab;
