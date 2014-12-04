var _ = require('lodash-node');
var Lab = require('lab');
var sinon = require('sinon');
var expect = require('code').expect;
var lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;

var Socket = require('../lib/shared/socket');

function wrapDone(fn) {
    return function(done) {
        fn();
        done && done();
    };
}

describe('base Socket implementation', function () {
    describe('constructor', function () {
        var socket, init;
        beforeEach(wrapDone(function () {
            init = sinon.spy(Socket.prototype, "initialize");
            socket = new Socket('main');
        }));
        afterEach(wrapDone(function () {
            init.restore();
        }));
        it('sets channel property', wrapDone(function () {
            expect(socket.channel).to.equal('main');
        }));
        it('sets options property', wrapDone(function () {
            var socket2 = new Socket('content', {foo: 'bar'});
            expect(socket.options).to.be.an.object().and.to.deep.equal({});
            expect(socket2.options).to.be.an.object().and.to.deep.equal({foo: 'bar'});
        }));
        it('calls initialize', wrapDone(function () {
            expect(init.called).to.equal(true);
            init.restore();
        }));
        it('sets _ports property to empty array if not in options', wrapDone(function () {
            expect(socket._ports).to.be.an.array().and.to.deep.equal([]);
        }));
        it('sets _ports property from options', wrapDone(function () {
            var options = {ports: ['foo']};
            var socket2 = new Socket('main', options);
            expect(socket2._ports).to.be.an.array().and.to.deep.equal(options.ports);
        }));
    });
    describe('addPort', function () {
        var socket, port;
        beforeEach(wrapDone(function () {
            port = {};
            socket = new Socket('main');
        }));
        it('adds new ports to _ports array', wrapDone(function () {
            var list = [1,2,3,4];
            list.forEach(function () {
                socket.addPort({});
            });
            expect(socket._ports.length).to.equal(list.length);
        }));
        it('emits portConnected event when a new port is added', wrapDone(function () {
            var cb = sinon.spy();
            socket.on('portConnected', cb);
            var list = [1,2,3,4];
            list.forEach(function () { socket.addPort({}); });
            list.forEach(function () { socket.addPort(port); });
            expect(socket._ports.length).to.equal(list.length + 1);
            expect(cb.callCount).to.equal(list.length + 1);
        }));
        it('ignores ports that are already in the _ports array', wrapDone(function () {
            var list = [1,2,3,4];
            list.forEach(function () {
                socket.addPort(port);
            });
            expect(socket._ports.length).to.equal(1);
        }));
    });

});

exports.lab = lab;
