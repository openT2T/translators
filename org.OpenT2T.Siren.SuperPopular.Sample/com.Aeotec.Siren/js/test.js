var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -c [ZWave bridge COM port] -a [JSON string that looks like: {\\\"homeId\\\":25478028,\\\"nodeId\\\":3} ]')
    .demand(['c','a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(serialPort, addressString) {
    this.props = '{"serialPort": "' + serialPort + '", "id": ' + addressString + '}';
    this.name = "Aeotec Siren (Test)";
}

var device = new Device(argv.c,argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.turnOn();
    setTimeout(function() {
        translator.turnOff();
        setTimeout(function() {
            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 3000);
        }, 5000);
    }, 5000);
}, 7000);

