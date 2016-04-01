var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -t [shade Id]')
    .demand(['t'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(shadeId) {
    this.props = ' { "id": "' + shadeId + '" }';
    this.name = "Test Shades";
}

var device = new Device(argv.t);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.open();
    setTimeout(function() {
        translator.close();
        setTimeout(function() {
            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 1000);
        }, 1000);
    }, 1000);
}, 1000);
