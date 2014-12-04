var sinon = require('sinon');
function noop() {}
var runtime = {
    onConnect: {
        addListener: noop
    },
    onMessage: {
        addListener: noop
    },
    listeners: {
        connect: [],
        message: []
    }
};

sinon.stub(runtime.onConnect, 'addListener', function (fn) {
    runtime.listeners.connect.push(fn);
});

sinon.stub(runtime.onMessage, 'addListener', function (fn) {
    runtime.listeners.message.push(fn);
});

var tabs = {
    sendMessage: sinon.stub(),
    query: sinon.stub()
};

exports.main = {
    runtime: runtime,
    tabs: tabs
};