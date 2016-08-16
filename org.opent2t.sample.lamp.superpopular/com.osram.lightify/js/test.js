var translator = require('./thingTranslator');
var q = require('q');

var argv = require('optimist')
    .usage('Usage: $0 -i [device Id] -a [security token]')
    .demand(['i'])
    .demand(['a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(deviceId, securityToken) {
    this.props = ' { "id": "' + deviceId + '", "security_token": "' + securityToken + '" }';
    this.name = "Lightify Light Bulb (Test)";
}

var device = new Device(argv.i, argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device)

// Go through a sequence of test operations for the translator
q.delay(1000)
.then(() => translator.turnOn())
.then(() => q.delay(5000))
.then(() => translator.setBrightness(100))
.then(() => q.delay(2000))
.then(() => translator.setBrightness(20))
.then(() => q.delay(2000))
.then(() => translator.turnOff())
.done();


