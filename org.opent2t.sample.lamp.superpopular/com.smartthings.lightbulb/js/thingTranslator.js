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

/**
 * Finds a resource for an entity in a schema
 */
function findResource(schema, di, resourceId) { 
    // Find the entity by the unique di 
    var entity = schema.entities.find((d) => { 
        return d.di === di; 
    }); 
    
    if (!entity) throw new Error('Entity - '+ di +' not found.');
    
    var resource = entity.resources.find((r) => { 
        return r.id === resourceId;  
    }); 

    if (!resource) throw new Error('Resource with resourceId \"' +  resourceId + '\" not found.'); 
    return resource; 
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
 * Colour Conversion Funcitons
 */

const ChangeTolerance = 0.0001;
const MaxHue = 360.0;
const MaxColor = 255;

/**
 * Convert HSV to RGB colours
 *   0 <= Hue <= 360
 *   0 <= Saturation <= 1
 *   0 <= lumosity <= 1 
 */
function HSVtoRGB(hue, saturation, lumosity) {
    var hi = Math.floor(hue / 60) % 6;
    var c = saturation * lumosity;
    var x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    var m = lumosity - c;

    var result;

    switch (hi)
    {
        case 0:
            result = [c, x, 0];
            break;
        case 2 :
            result = [x, c, 0];
            break;
        case 3:
            result = [0, c, x];
            break;
        case 4:
            result = [0, x, c];
            break;
        case 5:
            result = [x, 0, c];
            break;
        default:
            result = [c, 0, x];
            break;
    }
    return [(result[0] + m) * MaxColor, (result[1] + m) * MaxColor, (result[2] + m) * MaxColor]
}

/**
 * Convert RGB to HSV colours
 *   RGB values are in [0 ... 255]
 */
function RGBtoHSV(rgbValue) {
    var red = rgbValue[0] / MaxColor;
    var green = rgbValue[1] / MaxColor;
    var blue = rgbValue[2] / MaxColor;

    var min = Math.min(red, green, blue);
    var max = Math.max(red, green, blue);
    var delta = max - min;

    // fraction to byte
    var hue = 0 , saturation = 0;

    if (Math.abs(max) > ChangeTolerance)
        saturation = delta/max;
    else
    {
        // don't update Hue or saturation
        return undefined;
    }

    if (Math.abs(delta) < ChangeTolerance)
        return undefined;

    if (Math.abs(red - max) < ChangeTolerance)
        hue = (green - blue)/delta; // between yellow & magenta
    else if (Math.abs(green - max) < ChangeTolerance)
        hue = 2 + (blue - red)/delta; // between cyan & yellow
    else
        hue = 4 + (red - green)/delta; // between magenta & cyan

    hue *= 60; // degrees
    if (hue < 0)
        hue += MaxHue;
    if (hue > MaxHue)
        hue -= MaxHue;

    return {
        'hue': hue,
        'saturation': saturation,
        'level': max
    }
}

/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {

    // Build the power resource
    var power = {
        "href": "/power",
        "rt": ["oic.r.switch.binary"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

    // Build the dimming resource
    var dim = {
        "href": "/dim",
        "rt": ["oic.r.light.dimming"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

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

    // Include the values is expand is specified
    if (expand) {
        power.id = 'power';
        power.value = providerSchema['attributes'].switch == 'on';

        dim.id = 'dim';
        dim.dimmingSetting = providerSchema['attributes'].level;
        dim.range = [0, 100];

        colourMode.id = 'colourMode';
        colourMode.modes = ['rgb'];
        colourMode.supportedModes = ['rgb', 'chroma'];

        colourRGB.id = 'colourRGB';
        colourRGB.rgbvalue = HSVtoRGB(providerSchema['attributes'].hue * MaxHue / 100.0,
                                      providerSchema['attributes'].saturation / 100.0,
                                      providerSchema['attributes'].level / 100.0);
        colourRGB.range = [0, 255];

        colourChroma.id = 'colourChroma';
        colourChroma.ct = providerSchema['attributes'].colorTemperature;
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-smartthings-lightbulb',
            controlId: providerSchema['id']
        },
        pi: providerSchema['id'],
        mnmn: validateValue(providerSchema['manufacturer']),
        mnmo: validateValue(providerSchema['model']),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: providerSchema['id'],
                icv: 'core.1.1.0',
                dmv: 'res.1.1.0',
                resources: [
                    power,
                    dim,
                    colourMode,
                    colourRGB,
                    colourChroma
                ]
            }
        ]
    };
}

/***
 * Converts an OCF platform/resource schema for calls to the SmartThings API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    switch (resourceId) {
        case 'power':
            result['switch'] = resourceSchema.value ? 'on' : 'off';
            break;
        case 'dim':
            result['level'] = resourceSchema.dimmingSetting;
            break;
        case 'colourRGB':
            var HSVColor = RGBtoHSV(resourceSchema.rgbvalue);
            console.log(HSVColor);
            if (HSVColor !== undefined)
            {
                result['hue'] = Math.round(HSVColor.hue / MaxHue * 100);
                result['saturation'] = Math.round(HSVColor.saturation * 100);
                result['level'] = Math.round(HSVColor.level * 100);
            }
            break;
        case 'colourChroma':
            if (resourceSchema.ct !== undefined)
            {
                result['colorTemperature'] = resourceSchema.ct;
            } else {
                throw new Error("Invalid resourceId");
            }
            break
        default:
            // Error case
            console.log("Invalid resourceId: " + resourceId)
            throw new Error("Invalid resourceId");
    }
    return result;
}

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' schema.
class Translator {
        
    constructor(deviceInfo) {
        console.log('SmartThings Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.smartThingsHub = deviceInfo.hub;

        console.log('SmartThings Lightbulb initializing...Done');
    }

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return this.smartThingsHub.getDeviceDetailsAsync(this.controlId)
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
        if (di === this.controlId) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.smartThingsHub.putDeviceDetailsAsync(this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
                    return findResource(schema, di, resourceId);
                });
        } else {
            throw new Error('NotFound');
        }
    }

    getDevicesPower(di) {
        return this.getDeviceResource(di, "power");
    }

    postDevicesPower(di, payload) {
        return this.postDeviceResource(di, "power", payload)
    }

    getDevicesColourMode(di) {
        return this.getDeviceResource(di, "colourMode");
    }

    getDevicesColourRGB(di) {
        return this.getDeviceResource(di, "colourRGB");
    }

    postDevicesColourRGB(di, payload) {
        return this.postDeviceResource(di, "colourRGB", payload);
    }

    getDevicesDim(di) {
        return this.getDeviceResource(di, "dim");
    }

    postDevicesDim(di, payload) {
        return this.postDeviceResource(di, "dim", payload);
    }

    getDevicesColourChroma(di) {
        return this.getDeviceResource(di, "colourChroma");
    }

    postDevicesColourChroma(di, payload) {
        return this.postDeviceResource(di, "colourChroma", payload);
    }

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        return this.smartThingsHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        return this.smartThingsHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;