var translator = require('./thingTranslator');
var Q = require('q');

var argv = require('optimist')
    .usage('Usage: $0 -c [ZWave bridge COM port] -a [JSON string that looks like: {\\\"homeId\\\":25478028,\\\"nodeId\\\":3} ]')
    .demand(['c','a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(serialPort, addressString) {
    this.props = '{"serialPort": "' + serialPort + '", "id": ' + addressString + '}';
    this.name = "GE Smart Dimmer";
}

var device = new Device(argv.c,argv.a);


// initialize the translator for testing purposes (this is normally called by the runtime)
// This assumes that the translator is using promises.
// initDevice fulfills a promise when the zwave is ready to accept commands
translator.initDevice(device)
    .then(translator.turnOn)
    .delay(5000)
    .then(function() { return translator.setBrightness(10); })
    .delay(5000)
    .then(translator.turnOff)
    .delay(2000)
    .then(translator.disconnect)
    .then(process.exit);
