var isChrome = typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined';
var chrome = require('./lib/chrome');
var firefox = require('./lib/firefox');

module.exports = isChrome ? chrome : firefox;