'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var crypto = require('crypto');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

/**
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('SmartThings' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new OpenT2TError(400, 'Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new OpenT2TError(400, 'Invalid argument: ' + argName + '. ' +
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

    if (!entity) {
        throw new OpenT2TError(404, 'Entity - '+ di +' not found.');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new OpenT2TError(404, 'Resource with resourceId \"' +  resourceId + '\" not found.');
    }
    return resource;
}

/**
 * Colour Conversion Funcitons
 */

const ChangeTolerance = 0.0001;
const MaxHue = 360.0;
const MaxColor = 255;
const OneMil = 1000000.0;

/**
 * Convert HSV to RGB colours
 *   0 <= Hue < 360
 *   0 <= Saturation <= 1
 *   0 <= lumosity <= 1
 */
function HSVtoRGB(hue, saturation, lumosity) {

    var ajdHue = hue >= 360 ? hue - 1 : hue;

    var hi = Math.floor(ajdHue / 60) % 6;
    var c = saturation * lumosity;
    var x = c * (1 - Math.abs(((ajdHue / 60) % 2) - 1));
    var m = lumosity - c;

    var result;

    switch (hi)
    {
        case 0:
            result = [c, x, 0];
            break;
        case 1 :
            result = [x, c, 0];
            break;
        case 2:
            result = [0, c, x];
            break;
        case 3:
            result = [0, x, c];
            break;
        case 4:
            result = [x, 0, c];
            break;
        default:
            result = [c, 0, x];
            break;
    }
    return [Math.round((result[0] + m) * MaxColor), Math.round((result[1] + m) * MaxColor), Math.round((result[2] + m) * MaxColor)]
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
 * Returns a default value if the specified property is null, undefined, or an empty string
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || property === null || property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

/**
 * Given a SmartThings provider formatted Schema, calculate the
 * desired brightness as a percentage of the current setting
 */
function getDesiredBrightnessState(providerSchema, resourceSchema) {

    var result = {};

    if (providerSchema.attributes.hasOwnProperty('level')) {

        var level = parseInt(providerSchema.attributes.level);

        // Special case: light is off
        if (providerSchema.attributes.hasOwnProperty('switch') &&
            providerSchema.attributes.switch == 'off') {
            level = 0; // Treat current dimmness as 0
        }

        if (resourceSchema.hasOwnProperty('dimmingSetPercentage')) {
            level = resourceSchema.dimmingSetPercentage;
        } else if (resourceSchema.hasOwnProperty('dimmingIncrementPercentage')) {
            level += resourceSchema.dimmingIncrementPercentage;
        } else if (resourceSchema.hasOwnProperty('dimmingDecrementPercentage')) {
            level -= resourceSchema.dimmingDecrementPercentage;
        }

        if (level < 0) {
            level = 0;
        } else if (level > 100) {
            level = 100;
        }

        result['switch'] = level > 0 ? 'on' : 'off';
        result['level'] = level;
    }

    return result;
}

/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {

    var supportCT = providerSchema['attributes'].colorTemperature !== undefined;
    var supportColour = ( providerSchema['attributes'].hue !== undefined
        && providerSchema['attributes'].saturation !== undefined
        && providerSchema['attributes'].level !== undefined ) ;

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

    // Build the org.opent2t.r.light.dimPercentage resource
    var dimPercentage  = {
         "href": "/dimPercentage",
         "rt": ["org.opent2t.r.light.dimming"],
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
        if (dim.dimmingSetting > 100 ) dim.dimmingSetting = 100;
        dim.range = [0, 100];

        dimPercentage.id = 'dimPercentage';
        dimPercentage.dimmingSetPercentage = dim.dimmingSetting;
        dimPercentage.dimmingIncrementPercentage = 0;
        dimPercentage.dimmingDecrementPercentage = 0;

        if (supportColour) {
            colourMode.id = 'colourMode';
            colourMode.modes = ['rgb'];
            colourMode.supportedModes = ['rgb'];

            colourRGB.id = 'colourRGB';
            colourRGB.rgbValue = HSVtoRGB(providerSchema['attributes'].hue * MaxHue / 100.0,
                                          providerSchema['attributes'].saturation / 100.0,
                                          providerSchema['attributes'].level / 100.0);
            colourRGB.range = [0, 255];
        }

        if (supportCT) {
            colourChroma.id = 'colourChroma';
            colourChroma.ct = Math.round( OneMil / providerSchema['attributes'].colorTemperature );

            if (supportColour) {
                colourMode.supportedModes = ['rgb', 'chroma'];
            } else {
                colourMode.id = 'colourMode';
                colourMode.modes = ['chroma'];
                colourMode.supportedModes = ['chroma'];
            }
        }
    }

    var resources = [power, dim, dimPercentage];

    if (supportColour && supportCT) {
        resources.push(colourMode);
        resources.push(colourChroma);
        resources.push(colourRGB);
    } else if (supportColour) {
        resources.push(colourMode);
        resources.push(colourRGB);
    } else if (supportCT) {
        resources.push(colourMode);
        resources.push(colourChroma);
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-smartthings-lightbulb',
            controlId: providerSchema['id'],
            endpointUri: providerSchema['endpointUri']
        },
        availability: providerSchema['status'] === 'ONLINE' || providerSchema['status'] === 'ACTIVE' ? 'online' : 'offline',
        pi: providerSchema['id'],
        mnmn: defaultValueIfEmpty(providerSchema['manufacturer'], "SmartThings"),
        mnmo: defaultValueIfEmpty(providerSchema['model'], "Light Bulb (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                rt: ['opent2t.d.light'],
                di: generateGUID( providerSchema['id'] + 'opent2t.d.light' ),
                icv: 'core.1.1.0',
                dmv: 'res.1.1.0',
                resources: resources
            }
        ]
    };
}

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' schema.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-smartthings-lightbulb";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.endpointUri = deviceInfo.deviceInfo.opent2t.endpointUri;
        this.smartThingsHub = deviceInfo.hub;

        this.logger.info('SmartThings Lightbulb initializing...Done');
    }

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.smartThingsHub.getDeviceDetailsAsync(this.endpointUri, this.controlId)
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
        if (di === generateGUID( this.controlId + 'opent2t.d.light' )) {
          return this._resourceSchemaToProviderSchemaAsync(resourceId, payload)
            .then((putPayload) => {
                return this.smartThingsHub.putDeviceDetailsAsync(this.endpointUri, this.controlId, putPayload)
                    .then((response) => {
                        var schema = providerSchemaToPlatformSchema(response, true);
                        return findResource(schema, di, resourceId);
                    });
                });
        } else {
            throw new OpenT2TError(404, OpenT2TConstants.DeviceNotFound);
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

    getDevicesDimPercentage(di) {
        return this.getDeviceResource(di, "dimPercentage");
    }

    postDevicesDimPercentage(di, payload) {
        return this.postDeviceResource(di, "dimPercentage", payload);
    }

    getDevicesColourChroma(di) {
        return this.getDeviceResource(di, "colourChroma");
    }

    postDevicesColourChroma(di, payload) {
        return this.postDeviceResource(di, "colourChroma", payload);
    }

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub._unsubscribe(subscriptionInfo);
    }

     /***
     * Converts an OCF platform/resource schema for calls to the SmartThings API
     */
    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema) {

        // build the object with desired state
        var result = {};

        switch (resourceId) {
            case 'power':
                result['switch'] = resourceSchema.value ? 'on' : 'off';
                break;
            case 'dim':
                result['level'] = resourceSchema.dimmingSetting;
                break;
            case 'dimPercentage':
                // Get the device from SmartThings in order to figure out what the current dimness setting is
                return this.smartThingsHub.getDeviceDetailsAsync(this.endpointUri, this.controlId).then((providerSchema) => {
                    return getDesiredBrightnessState(providerSchema, resourceSchema);
                });
            case 'colourRGB':
                var HSVColor = RGBtoHSV(resourceSchema.rgbValue);
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
                    result['colorTemperature'] = Math.round( OneMil / resourceSchema.ct );
                } else {
                    return Promise.reject(OpenT2TConstants.InvalidResourceId);
                }
                break
            default:
                // Error case
                return Promise.reject(OpenT2TConstants.InvalidResourceId);
        }

        return Promise.resolve(result);
    }
}

// Export the translator from the module.
module.exports = Translator;