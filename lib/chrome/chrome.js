var runtime;

if (!runtime) {
    runtime = (typeof chrome !== 'undefined') ? chrome : {};
}

module.exports = runtime;