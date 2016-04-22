var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -i [polar h7 Id]')
    .demand(['i'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)
function Device(id) {
    this.props = ' { "id": "' + id + '" }';
    this.name = "Polar H7 (Test)";
}

var device = new Device(argv.i);

console.log("Make sure both metal pads are in contact with skin");

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout( function(){
	translator.GetBeatsPerMinute(function(beatsPerMinute) {
		setTimeout( function(){
			console.log("%s bpm", beatsPerMinute);

			translator.disconnect();
			setTimeout( function(){

				process.exit(0);
			}, 100);
		}, 500);
	}, 1000);
}, 5000);
