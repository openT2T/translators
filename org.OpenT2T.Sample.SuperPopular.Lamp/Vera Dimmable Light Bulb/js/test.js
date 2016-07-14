var translator = require('./thingTranslator');
var q = require('q');

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

// Go through a sequence of test operations for the translator
q.delay(1000)
.then(() => translator.turnOn())
.then(() => q.delay(5000))
.then(() => translator.setBrightness(20))
.then(() => q.delay(5000))
.then(() => translator.turnOff())
.done();