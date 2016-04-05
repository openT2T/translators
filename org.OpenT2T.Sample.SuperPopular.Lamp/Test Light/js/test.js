var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -t [bulb Id]')
    .demand(['t'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(id) {
    this.props = ' { "id": "' + id + '" }';
    this.name = "Test Light";
}

var device = new Device(argv.t);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.turnOn();
    setTimeout(function() {
        translator.turnOff();
        setTimeout(function() {
            translator.setBrightness(100);
            setTimeout(function() {
                translator.disconnect();
                setTimeout(function() {
                    process.exit(0);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}, 1000);
