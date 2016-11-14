"use strict";

const PLUGIN_NAME = 'Naming Validator';
var utils = require('./utilities');
var path = require('path');

// The namingValidator validates that the name of the translator is consistent
// between the translator folder and the package.json file.  It also validates
// that the name of the translator is correctly prepended in the package.json file.
function verify(file, log) {
    const NAME_PREFIX = 'opent2t-translator-';
    var metadata = JSON.parse(file.contents.toString());
    var folderName = path.basename(path.dirname(path.dirname(file.path)));
    var expectedName = NAME_PREFIX + folderName.replace(/\./g, '-');

    if(metadata.name !== expectedName) {
        log.error(file.path, 'Incorrect translator name. Expected: ' + expectedName);
    }
}

module.exports = utils.createTaskFunction(PLUGIN_NAME, verify);
