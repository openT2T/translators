'use strict';

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema){
    return {
        id: deviceSchema['id'],
        n: deviceSchema['name'],
        rt: 'org.opent2t.sample.binaryswitch.superpopular',
        power: { 'value': deviceSchema['attributes'].switch == 'on' }
    };
}

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = {};

    if (translatorSchema.power) {
        result['switch'] = translatorSchema.power.value ? 'on' : 'off';
    }

    return result;
}

var deviceId;
var SmartThingsHub;

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('SmartThings Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        deviceId = deviceInfo.deviceInfo.id;
        SmartThingsHub = deviceInfo.hub;

        console.log('SmartThings Binary Switch initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    getBinarySwitchResURI() {
        return SmartThingsHub.getDeviceDetailsAsync(deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response);
            });
    }

    // Updates the current state of the binary switch with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postBinarySwitchResURI(postPayload) {

        console.log('postBinarySwitchResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return SmartThingsHub.putDeviceDetailsAsync(deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response);
            });
    }

    // exports for individual properties

    getPower() {
        console.log('getPower called');

        return this.getBinarySwitchResURI()
            .then(response => {
                return response.power.value;
            });
    }

    setPower(value) {
        console.log('setPower called with value: ' + value);

        var postPayload = {};
        postPayload.power = { value: value };

        return this.postBinarySwitchResURI(postPayload)
            .then(response => {
                return response.power.value;
            });
    }
}

// Export the translator from the module.
module.exports = Translator;
