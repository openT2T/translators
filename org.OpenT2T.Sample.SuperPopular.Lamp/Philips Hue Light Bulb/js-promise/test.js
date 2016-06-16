var translator = require('./thingTranslator.js');
var q = require('q');

var argv = require('optimist')
    .usage('Usage: $0 -a [ip address of hue bridge] -u [hue user id] -i [hue light unique id]')
    .demand(['a'])
    .demand(['u'])
    .demand(['i'])
    .argv;

function Device(ipAddress, userId, uniqueId) {
    this.props = JSON.stringify(
        {
            "ipAddress": ipAddress,
            "userId": userId,
            "uniqueId": uniqueId
        });

    this.name = "Hue Light (Test)";
}

var device = new Device(argv.a, argv.u, argv.i);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
q.delay(1000)
.then(() => translator.turnOn())
.then(() => q.delay(5000))
.then(() => translator.turnOff())
.then(() => q.delay(2000))
.then(() => translator.turnOn())
.then(() => q.delay(2000))
.then(() => translator.turnOff())
.then(() => q.delay(2000))
.then(() => translator.turnOn())
.then(() => q.delay(2000))
.then(() => translator.turnOff())
.then(() => q.delay(2000))
.done();
