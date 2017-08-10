'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var crypto = require('crypto');
var colorConvert = require('color-convert');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/


/**
 * Validates an argument matches the expected type.
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
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
 * Generate a GUID for given an ID.
 *
 * TODO: This method should be moved to a shared location for all translators
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Wink' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

/**
 * Finds a resource for an entity in a schema
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function findResource(schema, di, resourceId) {
    // Find the entity by the unique di
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) {
        throw new OpenT2TError(404, 'Entity - ' + di + ' not found.');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new OpenT2TError(404, 'Resource with resourceId \"' + resourceId + '\" not found.');
    }

    return resource;
}

/**
 * Validates that an object (arguments[0]) contains properties
 * (arguments[1...n]) and throws a descriptive OpenT2T error if the
 * request is malformed.
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function validateHasOwnProperty() {
    var missing = [];
    for (var i = 1; i < arguments.length; i++) {
        if (!arguments[0].hasOwnProperty(arguments[i])) {
            missing.push(arguments[i]);
        }
    }

    if (missing.length > 0) {
        throw new OpenT2TError(400, `Request missing ${missing} - ${JSON.stringify(arguments[0])}`);
    }
}

/**
 * Returns a default value if the specified property is null, undefined, or an empty string
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || property === null || property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

/**
 * Create a colourRgb resource
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createColourRGBResource(expand, rgbArray, range = [0, 255]) {
    var colourRgb = {
        href: '/colourRGB',
        rt: ['oic.r.colour.rgb'],
        if: ['oic.if.a', 'oic.if.baseline']
    }

    if (expand) {
        colourRgb.id = "colourRGB";
        colourRgb.rgbValue = rgbArray;
        colourRgb.range = range;
    }

    return colourRgb;
}

/**
 * Creates a colour chroma resource based on the hsv, csc, and ct values
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createColourChromaResource(expand, hsvValue, cscValue, ctValue) {
    var colourChroma = {
        href: "/colourChroma",
        rt: ['oic.r.colour.chroma'],
        if: ['oic.if.a', 'oic.if.baseline']
    }

    if (expand) {
        colourChroma.id = "colourChroma";

        if (hsvValue) {
            colourChroma.hue = hsvValue[0];
            colourChroma.saturation = hsvValue[1];
        }

        if (cscValue) {
            colourChroma.csc = [cscValue[0], cscValue[1]];
        }

        if (ctValue) {
            colourChroma.ct = ctValue;
        }
    }

    return colourChroma;
}

/**
 * Creates a colour mode resource
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createColourModeResource(expand, modes, supportedModes) {
    // Ensure that modes have no duplicates in either array
    modes = modes.filter((m, pos) => { return modes.indexOf(m) == pos});
    supportedModes = supportedModes.filter((m, pos) => { return supportedModes.indexOf(m) == pos});

    var colourMode = {
        href: "/colourMode",
        rt: ['oic.r.mode'],
        if: ['oic.if.a', 'oic.if.baseline']
    }

    if (expand) {
        colourMode.modes = modes;
        colourMode.supportedModes = supportedModes;
        colourMode.id = "colourMode";
    }

    return colourMode;
}

/**
 * Creates a power resource
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createPowerResource(expand, value) {
    var power = {
        "href": "/power",
        "rt": ["oic.r.switch.binary"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

    if (expand) {
         power.id = "power";
         power.value = value ? true : false;
    }

    return power;
}

/**
 * Creates a dimming resource
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createDimmingResource(expand, dimmingSetting, dimmingRange = [0, 100]) {
     var dim = {
         "href": "/dim",
         "rt": ["oic.r.light.dimming"],
         "if": ["oic.if.a", "oic.if.baseline"]
    }

    if (expand) {
        dim.id = "dim";
        dim.dimmingSetting = dimmingSetting;
        dim.range = dimmingRange;
    }

    return dim;
}

/**
 * Creates a dimPercentage resource
 * 
 * TODO: This method should be moved to a shared location for all translators
 */

function createDimPercentageResource(expand, dimmingSetting, dimmingIncrementPercentage = 0, dimmingDecrementPercentage = 0) {

     var dimPercentage  = {
         "href": "/dimPercentage",
         "rt": ["org.opent2t.r.light.dimming"],
         "if": ["oic.if.a", "oic.if.baseline"]
    }

    if (expand) {
        dimPercentage.id = "dimPercentage";

        dimPercentage.dimmingSetPercentage = dimmingSetting;
        dimPercentage.dimmingIncrementPercentage = dimmingIncrementPercentage;
        dimPercentage.dimmingDecrementPercentage = dimmingDecrementPercentage;

    }

    return dimPercentage;
}

/**
 * Create the required resources for colour support.
 * 
 * If any colour is supported, then the platform will include both RGB and Chroma resources (by way
 * of conversion).  If colour temperature is supported, then a Chroma resource with ct will be used.
 * 
 * bulbInfo:
 *      power (true, false)
 *      dimmingSetting (1-100)
 *      modes [] (rgb, hsb, csc, ct)
 *      supportedModes [] (rgb, hsb, csc, ct)
 *      hue (0-360)
 *      saturation (0-100)
 *      csc [x,y] (0-1.0)
 *      rgb [r,g,b] (0-255)
 *      temperatureMired
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function createLightBulbResources(expand, bulbInfo) {
    var resources = [];
    var hsvValue, xyzValue, ctValue, rgbValue;

    // If Hue & Saturation are provided we can convert them into RGB
    if (bulbInfo.hasOwnProperty('hue') && bulbInfo.hasOwnProperty('saturation')) {
        hsvValue = [ bulbInfo.hue, bulbInfo.saturation, bulbInfo.dimmingSetting ]
        rgbValue = colorConvert.hsv.rgb(hsvValue);
    }

    // If XYZ are provided we can convert them into RGB
    if (bulbInfo.hasOwnProperty('csc') && bulbInfo.csc.length > 1) {
        xyzValue = [ bulbInfo.csc[0], bulbInfo.csc[1], bulbInfo.dimmingSetting / 100];
        if (!rgbValue) {
            rgbValue = colorConvert.xyz.rgb(xyzValue);
        }
    }

    // If RGB is provided use it directly
    if (bulbInfo.hasOwnProperty('rgb') && bulbInfo.rgb.length == 3) {
        // Overwrite any rgbValue that may have been calculated from HSV or XYZ
        rgbValue = bulbInfo.rgb;
    }

    // Supports colour temperature
    if (bulbInfo.hasOwnProperty('temperatureMired')) {
        ctValue = bulbInfo.temperatureMired;
        // If CT is supported, there may not be any data for any other colour modes, even if they are supported otherwise.
        // as a result, there won't be data to create a colourRGB resource, which the translator must return if the bulb
        // supports colour at all.
        if (bulbInfo.supportedModes.indexOf('rgb') > -1 ||
            bulbInfo.supportedModes.indexOf('hsb') > -1 ||
            bulbInfo.supportedModes.indexOf('csc') > -1) {
                // Knowing the colour temperature, the RGB value can be calculated, though it is in-exact.
                // See here https://en.wikipedia.org/wiki/Color_temperature#Approximation
                // Since the colourMode resource will tell the consumer that the bulb is in 'ct' mode,
                // they shouldn't be relying on the RGB value, which will just be white here as the bulb
                // is in 'white' mode, even though it may be slightly yellow or blue
                rgbValue = [255,255,255];
        }
    }

    // Translator always provides a translation into RGB if available
    // This merely lets the caller know that RGB will be available, it's possible that
    // the bulb doesn't truly support it, but the conversion responsibility on POST belongs
    // to the translator.
    if (rgbValue) {
         bulbInfo.supportedModes.push('rgb');
    }

    // Add the power resource
    if (bulbInfo.hasOwnProperty('power')) {
        resources.push(createPowerResource(expand, bulbInfo.power));
    }

    // Add the dimming resource
    if (bulbInfo.hasOwnProperty('dimmingSetting')) {
        resources.push(createDimmingResource(expand, bulbInfo.dimmingSetting));
        resources.push(createDimPercentageResource(expand, bulbInfo.dimmingSetting));
    }

    // Add the coorChroma resource if a supported colour is available
    if (ctValue || hsvValue || xyzValue) {
        resources.push(createColourChromaResource(expand, hsvValue, xyzValue, ctValue));
    }

    // Add the colourRGB resource if anything resulted in producing an rgb value
    if (rgbValue) {
        resources.push(createColourRGBResource(expand, rgbValue));
    }

    // If any colour modes are supported, include a colourMode resource
    if (bulbInfo.hasOwnProperty('modes') && bulbInfo.modes.length > 0) {
        // All modes are supportedModes by definition
        bulbInfo.supportedModes = bulbInfo.modes.concat(bulbInfo.supportedModes);
        resources.push(createColourModeResource(expand, bulbInfo.modes, bulbInfo.supportedModes));
    }

    return resources;
}

/**
 * Converts a value from one scale [0...originalRange] to another [0...newRange], optionally
 * rounding the result to the nearest integer.
 * 
 * TODO: This method should be moved to a shared location for all translators
 */
function scaleValue(value, originalRange, newRange, round = false) {
    if (value === undefined) {
        return value;
    }

    var newValue = (value / originalRange) * newRange;
    return round ? Math.round(newValue) : newValue;
}

/**
 * Gets the supported colour modes for a Wink bulb
 * 
 * Gets the lightbulb data from Wink, and uses it to figure out what colour modes are supported.
 * This is needed because Wink will allow us to set the wrong mode with an undetectable failure.
 * We can't just use providerSchema.capabilities.fields to get color_models because it lists
 * modes that the bulb cannot use.
 * 
 * Bulbs always expose the properties of the colours that they support, regardless of what color_model
 * is currently active.
 */
function getProviderColourModes(providerSchema) {
    var supportedModes = [];

    if (providerSchema.hasOwnProperty('hue') && providerSchema.hasOwnProperty('saturation')) {
        supportedModes.push('hsb');
    }

    if (providerSchema.hasOwnProperty('color')) {
        supportedModes.push('rgb');
    }

    if (providerSchema.hasOwnProperty('color_x') && providerSchema.hasOwnProperty('color_y'))
    {
        supportedModes.push('xy');
    }

    if (providerSchema.hasOwnProperty('color_temperature')) {
        supportedModes.push('color_temperature');
    }

    return supportedModes;
}

/**
 * Given a Wink provider formatted Schema, and a colour resource object,
 * choose the best color_model to apply the the bulb, in the event that the
 * requested mode (inferred by the resource properties) is not supported.
 * 
 * Priority is RGB > HSB > XYZ if the requested mode is not supported.
 * If the resource is attempting to set more than one color mode, the first
 * will be used (eg: if hue, saturaton and csc are all values, hsb will be used)
 * 
 * This method exists because Wink doesn't report what modes are supported,
 * and setting the wrong mode results in a silent failure.
 * 
 * A side effect is that this method may result in a change to brightness as
 * a result of applying an RGB resource to a hsb bulb.  This is desired in order
 * to properly display the color.
 * 
 * NOTE: xyz/csc is not supported for the time being because we haven't found
 * a bulb that supports it.
 */
function getDesiredColourState(providerSchema, resourcePayload) {
    var state = {};

    // Get all the modes actually supported by Wink, only use last_reading
    var winkModes = getProviderColourModes(providerSchema.last_reading);

    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);
    var rgbValue, hsbValue, ctValue;

    // If provided RGB, attempt to use RGB, HSV, and XYZ in that order
    if (resourcePayload.hasOwnProperty('rgbValue')) {
        if (winkModes.indexOf('rgb') != -1) {
            // RGB -> RGB [0-255],[0-255],[0-255]
            rgbValue = resourcePayload.rgbValue;
        } else if (winkModes.indexOf('hsb') != -1) {
            // RGB -> HSB [0-360],[0-100],[0-100]
            // ParseInt ensures that the data in the resoruce payload is sanitized as a string will
            // break the color-convert library, also ensures that they are integers.
            hsbValue = colorConvert.rgb.hsv(
                parseInt(resourcePayload.rgbValue[0]),
                parseInt(resourcePayload.rgbValue[1]),
                parseInt(resourcePayload.rgbValue[2])
            );
        }
    } else if (resourcePayload.hasOwnProperty('hue')) {
        if (winkModes.indexOf('hsb') != -1) {
            // HSB -> HSB [0-360],[0-100],[0-100]
            hsbValue = [resourcePayload.hue, resourcePayload.saturation, scaleValue(stateReader.get('brightness'), 1.0, 100)];
        } else if (winkModes.indexOf('rgb') != -1) {
            // HSB -> RGB [0-255],[0-255],[0-255]
            rgbValue = colorConvert.hsv.rgb([
                resourcePayload.hue,
                resourcePayload.saturation,
                scaleValue(stateReader.get('brightness'), 1.0, 100)
            ]);
        }
    } else if (resourcePayload.hasOwnProperty('ct')) {
        if (winkModes.indexOf('color_temperature') != -1) {
            // CT -> CT [Kelvin]
            ctValue = resourcePayload.ct;
        }
    }

    if (rgbValue) {
        // Set mode to rgb and convert rgb to hex string (without #)
        state.color = colorConvert.rgb.hex(rgbValue);
    } else if (hsbValue) {
        //  Set mode to hsb, scale hue, saturaton and brightness to [0-1.0]
        state.color_model = 'hsb';
        state.hue = scaleValue(hsbValue[0], 360, 1.0);
        state.saturation = scaleValue(hsbValue[1], 100, 1.0);
        state.brightness = scaleValue(hsbValue[2], 100, 1.0);
    } else if (ctValue) {
        // Set mode to colour temperature, and convert Kelvin to Mired
        state.color_model = 'color_temperature';
        state.color_temperature = 1000000 / ctValue;
    }

    if (Object.keys(state).length == 0) {
        // No state was applied, so no valid conversion was available.
        throw new OpenT2TError(400, "Requested colour mode is unsupported by the platform: " + JSON.stringify(resourcePayload, null, 2));
    }

    return { desired_state: state };
}


/**
 * Given a Wink provider formatted Schema, calculate the
 * desired brightness as a percentage of the current setting
 */
function getDesiredBrightnessState(providerSchema, resourceSchema) {
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);
    var state = {};

    // Current brightness, already scaled
    var brightness = stateReader.get('brightness');

    // Special case: light is off
    if (!stateReader.get('powered')) {
        brightness = 0; // Treat current dimmness as 0
    }

    if (resourceSchema.hasOwnProperty('dimmingSetPercentage')) {
        brightness = scaleValue(resourceSchema.dimmingSetPercentage, 100, 1.0);
    } else if (resourceSchema.hasOwnProperty('dimmingIncrementPercentage')) {
        brightness += scaleValue(resourceSchema.dimmingIncrementPercentage, 100, 1.0);
    } else if (resourceSchema.hasOwnProperty('dimmingDecrementPercentage')) {
        brightness -= scaleValue(resourceSchema.dimmingDecrementPercentage, 100, 1.0);
    }

    if (brightness < 0) {
        brightness = 0;
    } else if (brightness > 1.0) {
        brightness = 1.0;
    }

    state['powered'] = brightness > 0 ? true : false;
    state['brightness'] = brightness;

    return { desired_state: state };
}

/**
 * Wink does not always populate every desired_state property, but last_reading doesn't necessarily
 * update as soon as we send our PUT request. Instead of relying just on one state or the other,
 * we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
 * if it is not.
 */
class StateReader {
    constructor(desired_state, last_reading) {
        this.desired_state = desired_state;
        this.last_reading = last_reading;
    }

    get(state) {
        if (this.desired_state[state] !== undefined) {
            return this.desired_state[state];
        }
        else {
            return this.last_reading[state];
        }
    }
}


/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);

    var bulbInfo = {
        power: stateReader.get('powered'),
        dimmingSetting: scaleValue(stateReader.get('brightness'), 1.0, 100),
        dimmingRange: [0,100],
    };

    /** 
     * Get the supported colour modes from the provider data.  The translator cannot use the
     * the capabilities field here as it reports incorrect modes, and setting a bad mode doesn'tell
     * report a failure that the translator is capable of catching.  last_reading is used here because
     * desired_state doesn't neccesarily contain valid colour data.
     * 
     * If an invalid value is set, Wink will place it in the desired_state successfully but it will not apply it
     * The value will be maintained in the desired state for 2 minutes, so if anybody (OpenT2T or otherwise) sets
     * wrong colour data, the translator could read the wrong values.  In order to deal with this the translator
     * needs to check whether the mode in the desired_state is truly supported before using it.  If it is not
     * supported, then the last_reading state will be used instead.  The desired_state needs to be used if the
     * value is valid so that the caller gets correct values back if they just set the state (eg: If a caller
     * changes a colour bulb to colour temperature, the the temperature colourMode should be returned by the POST).
     * 
     * If the caller is subscribed to changes in state, then this is all moot as they would get a post back when
     * the last_reading state changes.
     */
    var winkModes = getProviderColourModes(providerSchema.last_reading);
    var colorModel = winkModes.indexOf(stateReader.get('color_model')) > -1 ?
        stateReader.get('color_model') :
        providerSchema.last_reading.color_model;

    // Convert Wink color_model names into resource names
    bulbInfo.supportedModes = winkModes.map((mode) => {
        switch (mode) {
            case 'hsb':
            case 'rgb':
                return mode;
            case 'xy':
                return 'csc';
            case 'color_temperature':
                return 'ct';
       }
    });

    switch(colorModel) {
        case 'hsb':
            // Wink hue and saturation are both normalized to [0.0, 1.0]
            // So they need a quick conversion to [0, 360] and [0, 100] respectively
            bulbInfo.hue = scaleValue(stateReader.get('hue'), 1.0, 360);
            bulbInfo.saturation = scaleValue(stateReader.get('saturation'), 1.0, 100);
            bulbInfo.modes = ['hsb'];
            break;
        case 'xy':
            // Wink X and Y are [0.0, 1.0] range
            bulbInfo.x = stateReader.get('color_x');
            bulbInfo.y = stateReader.get('color_y');
            bulbInfo.modes = ['csc'];
            break;
        case 'color':
            // Wink RGB is a hex string
            bulbInfo.r = parseInt(stateReader.get('color').substring(0,2), 16);
            bulbInfo.g = parseInt(stateReader.get('color').substring(2,4), 16);
            bulbInfo.b = parseInt(stateReader.get('color').substring(4,6), 16);
            bulbInfo.modes = ['rgb'];
            break;
        case 'color_temperature':
            bulbInfo.temperatureMired = 1000000 / stateReader.get('color_temperature');
            bulbInfo.modes = ['ct'];
            break;
        default:
            // Unknown colour mode, so OpenT2T cannot control it.  This is not
            // an error, but missing functionality, and colour will not be supported.
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-wink-lightbulb',
            controlId: providerSchema['object_id']
        },
        availability: stateReader.get('connection') ? 'online' : 'offline',
        pi: providerSchema['uuid'],
        mnmn: defaultValueIfEmpty(providerSchema['device_manufacturer'], "Wink"),
        mnmo: defaultValueIfEmpty(providerSchema['manufacturer_device_model'], "Light Bulb (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                rt: ['opent2t.d.light'],
                di: generateGUID( providerSchema['object_id'] + 'opent2t.d.light' ),
                icv: 'core.1.1.0',
                dmv: 'res.1.1.0',
                resources: createLightBulbResources(expand, bulbInfo)
            }
        ]
    };
}

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-wink-lightbulb";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.winkHub = deviceInfo.hub;
        this.deviceType = 'light_bulbs';

        this.logger.info('Wink Lightbulb initializing...Done');
    }

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response.data, expand);
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
        if(di == generateGUID(this.controlId +'opent2t.d.light')) {
            return this._resourceSchemaToProviderSchemaAsync(resourceId, payload)
                .then((putPayload) => {
                    return this.winkHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload)
                        .then((response) => {
                            var schema = providerSchemaToPlatformSchema(response.data, true);
                            return findResource(schema, di, resourceId);
                        });
                });
        } else {
            throw new OpenT2TError(404, OpenT2TConstants.DeviceNotFound);
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

    postDevicesColourMode(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourMode", payload);
    }

    getDevicesColourRGB(deviceId) {
        return this.getDeviceResource(deviceId, "colourRGB")
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

    getDevicesDimPercentage(deviceId) {
        return this.getDeviceResource(deviceId, "dimPercentage");
    }

    postDevicesDimPercentage(deviceId, payload) {
        return this.postDeviceResource(deviceId, "dimPercentage", payload);
    }

    getDevicesColourChroma(deviceId) {
        return this.getDeviceResource(deviceId, "colourChroma");
    }

    postDevicesColourChroma(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourChroma", payload);
    }

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub._unsubscribe(subscriptionInfo);
    }

    /**
     * Converts an OCF platform/resource schema for calls to the Wink API
     */
    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema, existingProviderSchema) {
        // build the object with desired state
        var result = {};
        result.desired_state = existingProviderSchema ? existingProviderSchema.desired_state : {};

        var desired_state = result.desired_state;

        switch(resourceId) {
            case 'power':
                validateHasOwnProperty(resourceSchema, 'value');
                desired_state['powered'] = resourceSchema.value;
                break;
            case 'dim':
                validateHasOwnProperty(resourceSchema, 'dimmingSetting');
                desired_state['brightness'] = scaleValue(resourceSchema.dimmingSetting, 100, 1.0);
                break;
            case 'dimPercentage':
                // Get the device from Wink in order to figure out what the current dimness setting is
                return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId).then((providerSchema) => {
                    return getDesiredBrightnessState(providerSchema.data, resourceSchema);
                });
            case 'colourMode':
                validateHasOwnProperty(resourceSchema, 'modes');
                // Try to set the mode, a bad mode won't error.
                // It will sit in desired_state for 2 minutes and then go away.
                // Convert from resource modes to Wink colour names
                switch (resourceSchema.modes[0]) {
                    case 'ct':
                        desired_state['color_model'] = 'color_temperature';
                        break;
                    case 'csc':
                        desired_state['color_model'] = 'xy';
                        break;
                    default:
                        desired_state['color_model'] = resourceSchema.modes[0];
                }
                break;
            case 'colourRGB':
            case 'colourChroma':
                // Get the device from Wink in order to figure out which colour modes are actually supported
                return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId).then((providerSchema) => {
                    return getDesiredColourState(providerSchema.data, resourceSchema);
                });
            default:
                // Error case
                return Promise.reject(OpenT2TConstants.InvalidResourceId);
        }

        return Promise.resolve(result);
    }
}

// Export the translator from the module.
module.exports = Translator;