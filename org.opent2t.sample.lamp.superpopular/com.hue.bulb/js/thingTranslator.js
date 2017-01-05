'use strict';
var crypto = require('crypto');
var colour = require('./colour').Colour;

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

/**
 * Return the string "Undefined" if the value is undefined and null.
 * Otherwise, return the value itself.
 */
function validateValue(value) {
    if (value === undefined || value === null) {
        return 'Undefined';
    }
    return value;
}

/**
 * Finds a resource for an entity in a schema
 */

function findResource(schema, di, resourceId) {

    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) throw new Error('NotFound');

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) throw new Error('NotFound');

    return resource;
}

/**
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('PhilipsHue' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
}

/**
 * Converts a representation of a platform from the Hue API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {
    var states = providerSchema.state;
    if (providerSchema['modelid'] !== undefined) modelId = providerSchema['modelid'];

    // Build the oic.r.switch.binary resource
    var power = {
        "href": "/power",
        "rt": ["oic.r.switch.binary"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

    // Build the oic.r.dimming resource
    var dim = {
        "href": "/dim",
        "rt": ["oic.r.light.dimming"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

    // Include the values is expand is specified
    if (expand && states !== undefined) {
        power.id = 'power';
        power.value = providerSchema.state['on'];

        dim.id = 'dim';
        dim.dimmingSetting = Math.round((providerSchema.state['bri'] - 1) * 100 / 253);
        dim.range = [0, 100];
    }

    var resources = [ power, dim ];

    //Build colour resources if the lightbulb supports colour changing
    if (states !== undefined) {

        // Build the colourMode resource
        var colourMode = {
            "href": "/colourMode",
            "rt": ["oic.r.mode"],
            "if": ["oic.if.s", "oic.if.baseline"]
        }

        // Build the colourRGB resource
        var colourRGB = {
            "href": "/colourRGB",
            "rt": ["oic.r.colour.rgb"],
            "if": ["oic.if.a", "oic.if.baseline"]
        }

        // Build the colourChroma resource
        var colourChroma = {
            "href": "/colourChroma",
            "rt": ["oic.r.colour.chroma"],
            "if": ["oic.if.a", "oic.if.baseline"]
        }

        var hasRGB = false;

        if (expand) {
            colourMode.id = 'colourMode';
            colourMode.modes = 'rgb';
            colourMode.supportedModes = ['rgb', 'chroma'];

            colourRGB.id = 'colourRGB';
            colourRGB.range = [0, 255];
            if (states.xy !== undefined) {
                colourRGB.rgbvalue = colour.XYtoRGB({ x: states.xy[0], y: states.xy[1] }, modelId);
                hasRGB = true;
                colourChroma.csc = states.xy;
            } else if (states.hue !== undefined && states.sat !== undefined){
                colourRGB.rgbvalue = colour.HSVtoRGB(states.hue, states.sat, states.bri);
                hasRGB = true;
            }

            colourChroma.id = 'colourChroma';
            if (states.ct !== undefined) colourChroma.ct = states.ct;
            if (states.hue !== undefined) colourChroma.hue = states.hue;
            if (states.sat !== undefined) colourChroma.saturation = states.sat;
        }

        resources.push(colourMode);
        if (hasRGB) {
            resources.push(colourChroma)
            resources.push(colourRGB);
        } else if (states.ct !== undefined) {
            resources.push(colourChroma);
        }
    }
    
    var guid = generateGUID(providerSchema['deviceid']);
    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-hue-bulb',
            controlId: providerSchema['deviceid']
        },
        pi: guid,
        mnmn: validateValue(providerSchema['manufacturername']),
        mnmo: validateValue(providerSchema['modelid']),
        n:    validateValue(providerSchema['name']),
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: guid,
                icv: 'core.1.1.0',
                dmv: 'res.1.1.0',
                resources: resources
            }
        ]
    };
}

/*
 * Converts an OCF platform/resource schema for calls to the Hue API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    switch (resourceId) {
        case 'n':
            result['name'] = resourceSchema.n;
            break;
        case 'power':
            result['on'] = resourceSchema.value;
            break;
        case 'dim':
            var bri = Math.round((resourceSchema.dimmingSetting * 2.53) + 1);
            result['bri'] = bri;
            break;
        case 'colourRGB':
            var xyColor = colour.RGBtoXY(resourceSchema.rgbvalue, modelId);
            result['xy'] = [xyColor.x, xyColor.y];
            break;
        case 'colourChroma':
            if (resourceSchema.ct !== undefined) {
                result['ct'] = resourceSchema.ct;
            }
            
            if (resourceSchema.csc !== undefined) {
                result['xy'] = resourceSchema.csc;
            }

            if (resourceSchema.hue !== undefined) {
                result['hue'] = resourceSchema.hue;
            }

            if (resourceSchema.saturation !== undefined) {
                result['sat'] = resourceSchema.saturation;
            } 
            
            if(result.length === 0){
                throw new Error("Invalid resourceId");
            }
            break
        default:
            // Error case
            throw new Error("Invalid resourceId");
    }
    return result;
}

var modelId;
var controlId;
var deviceType = 'lights';
var hueHub;

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Hue Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        hueHub = deviceInfo.hub;

        console.log('Hue Lightbulb initializing...Done');
    }

    // exports for the entire schema object

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return hueHub.getDeviceDetailsAsync(deviceType, controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(di, resourceId) {
        return this.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
            });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        if(di === generateGUID(controlId)){
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);
            return hueHub.putDeviceDetailsAsync(deviceType, controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response[0], true);
                    return findResource(schema, di, resourceId);
                });  
        }
    }

    getDevicesPower(deviceId) {
        return this.getDeviceResource(deviceId, "power");
    }

    postDevicesPower(deviceId, payload) {
        return this.postDeviceResource(deviceId, "power", payload)
    }

    getDevicesColourMode(deviceId) {
        return this.getDeviceResource(deviceId, "colourMode");
    }

    getDevicesColourRGB(deviceId) {
        return this.getDeviceResource(deviceId, "colourRGB");
    }

    postDevicesColourRGB(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourRGB", payload);
    }

    getDevicesDim(deviceId) {
        return this.getDeviceResource(deviceId, "dim");
    }

    postDevicesDim(deviceId, payload) {
        return this.postDeviceResource(deviceId, "dim", payload);
    }

    getDevicesColourChroma(deviceId) {
        return this.getDeviceResource(deviceId, "colourChroma");
    }

    postDevicesColourChroma(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourChroma", payload);
    }

    postSubscribe(subscriptionInfo) {
        return hueHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return hueHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;