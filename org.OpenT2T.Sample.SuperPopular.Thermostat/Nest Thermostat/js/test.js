var translator = require('./thingTranslator');
var q = require('q');

var argv = require('optimist')
    .usage('Usage: $0 -i [device Id] -a [access token]')
    .demand(['i'])
    .demand(['a'])
    .argv;

function logAndValidate(p, expected) {
    return p.then(result => {
        if((expected !== undefined) && (result != expected))
        {
            throw "Expected: "+ expected + ", Actual: "+ result;
        }
        else
        {
            console.log("Result (As expcted) : " +result);
        }
        return result;
    }).catch(error => {
        console.log("Error: " + error.message);
        throw error;
    });
};

// device object used for testing purposes (this is normally populated by the runtime)
function Device(deviceId, accessToken) {
    this.props = ' { "id": "' + deviceId + '", "access_token": "' + accessToken + '" }';
    this.name = "Nest Thermostat (Test)";
}

var device = new Device(argv.i, argv.a);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

/// Go through a sequence of test operations for the translator
q.delay(1000)
	.then(() => translator.turnOff()) // Turn On/Off
	.then(() => q.delay(2000))
    .then(() => logAndValidate(translator.isTurnedOn(), false))
    .then(() => q.delay(2000))
	.then(() => translator.turnOn())
	.then(() => q.delay(2000))
    .then(() => logAndValidate(translator.isTurnedOn(), true))
    .then(() => q.delay(6000))
	.then(() => logAndValidate(translator.getAvailableModes())) // Set-Get Mode
    .then(() => q.delay(2000))
    .then(() => translator.setMode('cool'))
	.then(() => q.delay(2000))
    .then(() => logAndValidate(translator.getMode(), 'cool'))
    .then(() => q.delay(2000))
	.then(() => translator.setMode('heat'))
	.then(() => q.delay(2000))
    .then(() => logAndValidate(translator.getMode(), 'heat'))
    .then(() => q.delay(2000))
    .then(() => logAndValidate(translator.getCurrentTemperature(), 3)) // Set-Get temperature
	.then(() => q.delay(2000))
    .then(() => translator.setHeatingSetpoint(26))
	.then(() => q.delay(2000))
	.then(() => logAndValidate(translator.getHeatingSetpoint(), 26))
	.then(() => q.delay(2000))
	.done();