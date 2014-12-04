function callIfFunc(fn) {
    if ('function' !== typeof fn) return;
    var args = Array.prototype.slice(arguments, 1);
    return fn.apply(null, args);
}

module.exports = callIfFunc;