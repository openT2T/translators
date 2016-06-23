var translator = require('./thingTranslator');

var argv = require('optimist')
    .usage('Usage: $0 -i [device Id] -a [access token]')
    .demand(['i'])
    .demand(['a'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)
function Device(deviceId, accessToken) {
    this.props = ' { "id": "' + deviceId + '", "access_token": "' + accessToken + '" }';

    this.name = "Nest Thermostat (Test)";
}

var device = new Device(argv.i, argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

/// Go through a sequence of test operations for the translator
//Get ambient temperature
setTimeout(function() {
    translator.getAmbientTemperature("f", function(temp) {
        setTimeout(function() {
            console.log("%s", temp);

            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 1000);
        }, 5000);
    }, 5000);
}, 5000);

// 24'C  == 75'F
// Set & Get desired target temperature
setTimeout(function() {
    translator.setTargetTemperature("c", 24, function(temp) {
        setTimeout(function() {
            console.log("%s", temp);

            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 1000);
        }, 5000);
    }, 5000);
}, 5000);

setTimeout(function() {
    translator.getTargetTemperature("f", function(temp) {
        setTimeout(function() {
            if(temp != 75)
            {
                throw "Desired target temperature is not as expected (24'C/75'F)"
            }
            else
            {
                console.log("Desired target temperature is as expected: %s-F", temp);
            }
            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 1000);
        }, 5000);
    }, 5000);
}, 5000);