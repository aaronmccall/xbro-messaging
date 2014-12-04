var _ = require('lodash-node');
var Lab = require('lab');
var sinon = require('sinon');
var expect = require('code').expect;
var lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;

var messaging = require('../lib/chrome');
var chrome = require('../lib/chrome/chrome');
var helpers = require('./chrome_stub');


exports.lab = lab;

function wrapDone(fn) {
    return function(done) {
        fn();
        done && done();
    };
}

describe('chrome/Bus', function () {
    describe('initialize', function () {
        lab.before(wrapDone(function () {
            _.extend(chrome, helpers.main);
        }));
        lab.after(wrapDone(function () {
            Object.keys(helpers.main).forEach(function (key) {
                delete chrome[key];
            });
        }));
        it('only creates a bus on first call', wrapDone(function () {
            var bus = messaging.init();
            var bus2 = messaging.init();
            expect(bus.end).to.equal('main');
            expect(bus2.end).to.equal('main');
            expect(bus).to.equal(bus2);
        }));
        it('adds a listener to runtime.onMessage', wrapDone(function () {
            var bus = messaging.init();
            var stub = chrome.runtime.onMessage.addListener;
            expect(stub.called).to.equal(true);
            expect(stub.getCall(0).args).to.have.length(1);
            expect(stub.getCall(0).args[0]).to.be.a.function();
        }));
        it('adds a listener to runtime.onConnect', wrapDone(function () {
            var bus = messaging.init();
            var stub = chrome.runtime.onConnect.addListener;
            expect(stub.called).to.equal(true);
            expect(stub.getCall(0).args).to.have.length(1);
            expect(stub.getCall(0).args[0]).to.be.a.function();
        }));
        it.skip('adds a listener for own "connect" events');
    });

    describe.skip('connect', function () {
        it('_connector is _connectFromMain when end is "main"');
        it('_connector is _connectFromContent when end is not "main"');
    });

    describe.skip('_connectFromMain', function () {});
    describe.skip('_connectFromContent', function () {});

    describe.skip('send', function () {
        it('_sender is _sendFromMain when end is "main"');
        it('_sender is _sendFromContent when end is not "main"');
    });

    describe.skip('_sendFromMain', function () {});
    describe.skip('_sendFromContent', function () {});
});