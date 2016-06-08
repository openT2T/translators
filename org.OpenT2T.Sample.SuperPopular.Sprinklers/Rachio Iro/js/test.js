var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -a [token]')
    .demand(['a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(token) {
    this.props = ' { "token": "' + token + '" }';
    this.name = "Rachio Iro Sprinkler";
}

var device = new Device(argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.start(60);
    setTimeout(function() {
        translator.stop();
    }, 1000 * 30);
}, 1000);
