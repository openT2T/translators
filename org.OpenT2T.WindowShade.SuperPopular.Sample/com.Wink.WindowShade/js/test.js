var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -i [device Id] -a [access token]')
    .demand(['i'])
    .demand(['a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(deviceId, accessToken) {
    this.props = ' { "id": "' + deviceId + '", "access_token": "' + accessToken + '" }';
    this.name = "Wink Window Shades (Test)";
}

var device = new Device(argv.i, argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.close();
    setTimeout(function() {
        translator.open();
        setTimeout(function() {
            translator.close();
            setTimeout(function() {
                translator.open();
				setTimeout(function() {
					translator.disconnect();
				}, 5000);
            }, 5000);
        }, 5000);
    }, 5000);
}, 5000);

