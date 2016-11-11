"use strict";

var gutil = require('gulp-util');
var through = require('through2');

// Create a function to be used as a gulp task.
function createTaskFunction(pluginName, transform) {
    var errorOutputList = [];

    var log = {
        error: function(filepath, message) {
            errorOutputList.push(filepath + '\n' + gutil.colors.red("Error: ") + message);
        }
    }

    function errorOut(callback) {
        if (errorOutputList.length > 0) {
            this.emit('error', new gutil.PluginError(pluginName, '\n' + errorOutputList.join('\n\n') + '\n', {
                showStack: false
            }));
        }
        callback();
    }

    function transformFunction (file, encoding, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(new gutil.PluginError(pluginName, 'Streaming not supported'));
        }

        transform(file, log);
        return callback(null, file);
    }

    return function() {
        return through.obj(transformFunction, errorOut);
    };
}

module.exports = {
    createTaskFunction: createTaskFunction
}
