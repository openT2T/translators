var translator = require('./thingTranslator.js');

var argv = require('optimist')
    .usage('Usage: $0 -a [hue address] -u [hue user id] -i [hue unique id]')
    .demand(['a'])
    .demand(['u'])
    .demand(['i'])
    .argv;

function Device(hueAddress, userId, uniqueId) {
    this.props = JSON.stringify(
        {
            "hueAddress": hueAddress,
            "userId": userId,
            "uniqueId": uniqueId
        });

    this.name = "Hue Light (Test)";
}

var device = new Device(argv.a, argv.u, argv.i);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(device);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.turnOn();
    setTimeout(function() {
        translator.turnOff();
        setTimeout(function() {
            translator.turnOn();
            setTimeout(function() {
                translator.turnOff();
                setTimeout(function() {
                    translator.turnOn();
                    setTimeout(function() {
                        translator.turnOff();
                        setTimeout(function() {
                            process.exit(0);
                        }, 2000);
                    }, 2000);
                }, 2000);
            }, 2000);
        }, 2000);
    }, 5000);
}, 1000);


