var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -i [sensorTag Id]')
    .demand(['i'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function Device(id) {
    this.props = ' { "id": "' + id + '" }';
    this.name = "SensorTag (Test)";
}

var device = new Device(argv.i);

console.log("Press the button on the sensor tag. (wake sensor)");

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout( function(){
	translator.getCurrentTemperature(function(temp) {
		setTimeout( function(){
			console.log("%sC", temp);

			translator.disconnect();
			setTimeout( function(){

				process.exit(0);
			}, 100);
		}, 500);
	}, 1000);
}, 5000);
