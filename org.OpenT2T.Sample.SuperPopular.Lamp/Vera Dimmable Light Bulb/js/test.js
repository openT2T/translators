var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -i [device Id] -a [session token] -r [serverRelay] -p [pkDevice]')
    .demand(['i'])
    .demand(['a'])
    .demand(['r'])
    .demand(['p'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(deviceId, relaySessionToken, serverRelay, pkDevice) {
    this.props = ' { "id": "' + deviceId + '", "relay_session_token": "' + relaySessionToken + '", "relay_server": "' + serverRelay + '", "pk_device": "' + pkDevice + '" }';
    this.name = "Vera Light Bulb (Test)";
}

var device = new Device(argv.i, argv.a, argv.r, argv.p);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device)
    .then(function() { translator.turnOn(); })
    .delay(10000)
    .then(function() { return translator.setBrightness(40); })
    .delay(10000)
    .then(function() { translator.turnOff(); })
    .delay(2000)
    .then(function() { translator.disconnect(); })
    .then(process.exit);

