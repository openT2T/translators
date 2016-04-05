var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -c [ZWave bridge COM port] -a [JSON string that looks like: {\\\"homeId\\\":25478028,\\\"nodeId\\\":3} ]')
    .demand(['c','a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(serialPort, addressString) {
    this.props = '{"serialPort": "' + serialPort + '", "id": ' + addressString + '}';
    this.name = "Somfy Shade (Test)";
}

var device = new Device(argv.c,argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)initDevice(device)
initDevice(device);

setTimeout(function () {
    translator.close();
	setTimeout(function () {
	    translator.open();
		setTimeout(function () {
		    translator.close()
			setTimeout(function () {
			    translator.open()
				setTimeout(function () {
					process.exit(0);
				}, 2000);
			}, 2000);
		}, 2000);
	}, 2000);
}, 3000);


