'use strict';

var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var InsteonConstants = require('./constants');
var crypto = require('crypto');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

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
 * Generate a GUID for a given ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Insteon' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

var deviceHvacModeToTranslatorHvacModeMap = {
    'cool': 'coolOnly',
    'heat': 'heatOnly',
    'auto': 'auto',
    'all_off': 'off'
}

var translatorHvacModeToDeviceHvacModeMap = {
    'coolOnly': 'cool',
    'heatOnly': 'heat',
    'auto': 'auto',
    'off': 'all_off'
}

function deviceHvacModeToTranslatorHvacMode(mode) {
    return deviceHvacModeToTranslatorHvacModeMap[mode];
}

function translatorHvacModeToDeviceHvacMode(mode) {
    return translatorHvacModeToDeviceHvacModeMap[mode];
}

function readHvacMode(deviceSchema) {

    // Assume 'auto' and 'off' are always supported
    var supportedHvacModes = [
        'auto',
        'off'
    ];

    if (deviceSchema['cool_point']) {
        supportedHvacModes.push('coolOnly');
    }
    if (deviceSchema['heat_point']) {
        supportedHvacModes.push('heatOnly');
    }

    var hvacMode = deviceHvacModeToTranslatorHvacMode(deviceSchema['mode']);

    return {
        supportedModes: supportedHvacModes,
        modes: [hvacMode]
    };
}

function readFanMode(deviceSchema) {
    // Assume 'auto' and 'on' are always supported
    var supportedHvacModes = ['auto', 'on'];
    var fanMode = deviceSchema['fan'] === 'fan_on' ? 'on' : 'auto'

    return {
        supportedModes: supportedHvacModes,
        modes: [fanMode]
    };
}

function createResource(resourceType, accessLevel, id, expand, state) {
    var resource = {
        href: '/' + id,
        rt: [resourceType],
        if: [accessLevel, 'oic.if.baseline']
    }

    if (expand) {
        resource.id = id;
        Object.assign(resource, state);
    }

    return resource;
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

// Helper method to convert the provider schema to the platform schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    var max = providerSchema['cool_point'] || 0;
    var min = providerSchema['heat_point'] || 0;
    var temperature = (max > 0 && min > 0) ? ((max + min) / 2) : max > 0 ? max : min;
    var temperatureUnits = getUnitSafe(providerSchema, undefined);

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: providerSchema['ambient'],
        units: temperatureUnits
    });
    
    var adjustTemperature = createResource('oic.r.temperature', 'oic.if.a', 'adjustTemperature', expand, {
        temperature: 0,
        units: temperatureUnits
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: (providerSchema.mode === 'heat' ? min : (providerSchema.mode === 'cool' ? max : temperature)),
        units: temperatureUnits
    });

    var targetTemperatureHigh = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureHigh', expand, {
        temperature: max,
        units: temperatureUnits
    });

    var targetTemperatureLow = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureLow', expand, {
        temperature: min,
        units: temperatureUnits
    });

    // remove the '%' sign at the end the providerSchema for humidity
    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: providerSchema['humidity'] === undefined ? undefined : Number(providerSchema['humidity'].slice(0, -1))
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(providerSchema));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['fan'] !== undefined
    });

    var PlatformSchema = {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-insteon-thermostat',
            controlId: providerSchema['DeviceID']
        },
        availability: providerSchema['Reachable'] ? 'online' : 'offline',
        pi: generateGUID(providerSchema['DeviceID']),
        mnmn: defaultValueIfEmpty(providerSchema['Manufacturer'], 'Insteon'),
        mnmo: defaultValueIfEmpty(providerSchema['ProductType'], 'Thermostat (Generic)'),
        n: providerSchema['DeviceName'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                n: providerSchema['DeviceName'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['opent2t.d.thermostat'],
                di: generateGUID(providerSchema['DeviceID'] + 'opent2t.d.thermostat'),
                resources: [
                    ambientTemperature,
                    adjustTemperature,
                    targetTemperature,
                    targetTemperatureHigh,
                    targetTemperatureLow,
                    humidity,
                    hvacMode,
                    hasFan
                ]
            }
        ]
    };

    if (providerSchema['fan'] !== undefined) {
        var fanMode = createResource('oic.r.mode', 'oic.if.a', 'fanMode', expand, readFanMode(providerSchema));
        PlatformSchema.entities[0].resources.push(fanMode);
    }
    return PlatformSchema;
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'heatingFuelSource':
        case 'fanActive':
        case 'fanTimerActive':
        case 'fanTimerTimeout':
        case 'awayMode':
        case 'ecoMode':
            throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }
}

/**
 * If the user provides a unit, validate the value is within the units range.
 *  Range is defined as:
 *    c [9-32]
 *    f [50-90]
 * 
 * If the unit is provided and within range, returns provided unit 
 *  otherwise an exception is thrown.
 * 
 * If no unit is provided and the value is within one of the two ranges,
 *  the unit of the valid range will be returned, otherwise an 
 *  exception is thrown.
 * 
 * @param {*} resourceSchema 
 */
function getValidatedUnit(resourceSchema) {
    var value = resourceSchema.temperature;
    if (isDefined(resourceSchema, 'units')) {
        var unit = resourceSchema.units.toLowerCase();
        var min = getMinTemperature(unit);
        var max = getMaxTemperature(unit);
        if (value >= min && value <= max) {
            return unit;
        }
        throw new OpenT2TError(440, "Invalid temperature (" + value + ") for unit (" + unit + " [" + min + ", " + max + "])");
    }
    var min_f = getMinTemperature('f');
    var max_f = getMaxTemperature('f');
    if (value >= min_f && value <= max_f) {
        return 'f';
    }
    var min_c = getMinTemperature('c');
    var max_c = getMaxTemperature('c');
    if (value >= min_c && value <= max_c) {
        return 'c';
    }
    throw new OpenT2TError(440, "Temperature outside supported range (" + value + ")");
}

/**
 * Given a target temperature, compute an increment or decrement
 * to get the thermostat to centered around that value
 * @param {*} resourceSchema 
 * @param {*} providerSchema 
 */
function getTargetTemperatureRange(resourceSchema, providerSchema) {

    var unit = getValidatedUnit(resourceSchema);
    var providerUnit = getUnitSafe(providerSchema, unit);
    var temperature = convertTemperatureAbsolute(resourceSchema.temperature, unit, providerUnit);
    var min = getMinTemperature(providerUnit);
    var max = getMaxTemperature(providerUnit);

    var targetHigh = 0;
    var targetLow = 0;

    if (providerSchema.hasOwnProperty('cool_point') && providerSchema.hasOwnProperty('heat_point')) {
        targetHigh = providerSchema.cool_point;
        targetLow = providerSchema.heat_point;
    } else if (providerSchema.hasOwnProperty('cool_point')) {
        targetHigh = providerSchema.cool_point;
        targetLow = providerSchema.cool_point;
    } else if (providerSchema.hasOwnProperty('heat_point')) {
        targetHigh = providerSchema.heat_point;
        targetLow = providerSchema.heat_point;
    } else {
        // Thermostat is not set to anything
    }

    var range = targetHigh - targetLow;
    var halfRange = range / 2;
    var newTargetLow = temperature - halfRange;
    var newTargetHigh = temperature + halfRange;

    // If either value is outside min/max range, adjust accordingly
    if (newTargetLow < min) {
        newTargetLow = min;
        newTargetHigh = min + range;
    }

    if (newTargetHigh > max) {
        newTargetHigh = max;
        newTargetLow = Math.max(min, max - range);
    }

    var adjustedRange = newTargetLow - targetLow;

    var response = {};
    var command = {}

    // Temp, just for the response - convert back to users units
    response.cool_point = convertTemperatureAbsolute(newTargetHigh, providerUnit, unit);
    response.heat_point = convertTemperatureAbsolute(newTargetLow, providerUnit, unit);
    response.mode = 'auto';
    response.unit = unit;

    // Command for insteon
    command.command = adjustedRange < 0 ? 'temp_down' : 'temp_up';
    command.temp = Math.abs(adjustedRange);

    return { response, command };
}

function getTargetTemperatureHigh(resourceSchema, providerSchema) {
    var response = {};
    var command = {}

    var unit = getValidatedUnit(resourceSchema);
    var providerUnit = getUnitSafe(providerSchema, unit);

    // Temp just for the resource response
    response.cool_point = resourceSchema.temperature;
    response.mode = 'cool';
    response.unit = unit;

    // Command for insteon
    command.command = 'set_cool_to';
    command.temp = convertTemperatureAbsolute(resourceSchema.temperature, unit, providerUnit);

    return { response, command };
}

function getTargetTemperatureLow(resourceSchema, providerSchema) {
    var response = {};
    var command = {}

    var unit = getValidatedUnit(resourceSchema);
    var providerUnit = getUnitSafe(providerSchema, unit);

    // Temp just for the resource response
    response.heat_point = resourceSchema.temperature;
    response.mode = 'heat';
    response.unit = unit;

    // Command for insteon
    command.command = 'set_heat_to';
    command.temp = convertTemperatureAbsolute(resourceSchema.temperature, unit, providerUnit);

    return { response, command };
}

function getUnitSafe(providerSchema, defaultUnit) {
    return providerSchema.hasOwnProperty('unit') && providerSchema.unit != null ?
        providerSchema.unit.toLowerCase() : defaultUnit;
}

function isDefined(object, variable) {
    return object[variable] != undefined && object.variable !== null;
}

function getMinTemperature(unit) {
    return unit === 'f' ? 50 : 9;
}

function getMaxTemperature(unit) {
    return unit === 'f' ? 90 : 32;
}

function convertTemperatureAbsolute(temperature, from, to) {
    if (from === 'c' && to === 'f') {
        return (temperature * 1.8) + 32;
    } 
    if (from === 'f' && to === 'c') {
        return (temperature - 32) / 1.8;
    }
    return temperature;
}

function convertTemperatureIncrement(temperature, from, to) {
    if (from === 'c' && to === 'f') {
        return temperature * 1.8;
    } 
    if (from === 'f' && to === 'c') {
        return temperature / 1.8;
    }
    return temperature;
}

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-insteon-thermostat";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.insteonHub = deviceInfo.hub;

        this.logger.info('Insteon Thermostat initializing...Done');
    }

    /**
     * Queries the entire state of the thermostat
     * and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.insteonHub.getDeviceDetailsAsync(this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(di, resourceId) {
        validateResourceGet(resourceId);
        return this.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
            });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        if (di === generateGUID(this.controlId + 'opent2t.d.thermostat')) {
            return this._resourceSchemaToProviderSchemaAsync(resourceId, payload)
                .then((putPayload => {
                    // Resource payload has a few extra values passed along to create a valid response
                    // Trim down to the actual command before sending.
                    if (resourceId === 'targetTemperature' || resourceId === 'adjustTemperature') {
                        return this.insteonHub.putDeviceDetailsAsync(this.controlId, putPayload.command)
                            .then((response) => {
                                // Merge the responses                           
                                Object.assign(response, putPayload.response);
                                var schema = providerSchemaToPlatformSchema(response, true);
                                switch (response.mode) {
                                    case 'heat':
                                        return findResource(schema, di, 'targetTemperatureLow');
                                    case 'cool':
                                        return findResource(schema, di, 'targetTemperatureHigh');
                                    case 'auto':
                                        var low = findResource(schema, di, 'targetTemperatureLow');
                                        var high = findResource(schema, di, 'targetTemperatureHigh');
                                        var hvacMode = findResource(schema, di, 'hvacMode');
                                        return { low, high, hvacMode };
                                }
                            });
                    } else {
                        return this.insteonHub.putDeviceDetailsAsync(this.controlId, putPayload)
                            .then((response) => {
                                var schema = providerSchemaToPlatformSchema(response, true);
                                return findResource(schema, di, resourceId);
                            });
                    }
                }));
        } else {
            throw new OpenT2TError(404, OpenT2TConstants.DeviceNotFound);
        }
    }

    getDevicesAmbientTemperature(di) {
        return this.getDeviceResource(di, 'ambientTemperature');
    }
    
    getDevicesAdjustTemperature(di) {
        return this.getDeviceResource(di, 'adjustTemperature');
    }

    postDevicesAdjustTemperature(di, payload) {
        return this.postDeviceResource(di, 'adjustTemperature', payload);
    }

    getDevicesTargetTemperature(di) {
        return this.getDeviceResource(di, 'targetTemperature');
    }

    postDevicesTargetTemperature(di, payload) {
        return this.postDeviceResource(di, 'targetTemperature', payload);
    }

    getDevicesHumidity(di) {
        return this.getDeviceResource(di, 'humidity');
    }

    getDevicesTargetTemperatureHigh(di) {
        return this.getDeviceResource(di, 'targetTemperatureHigh');
    }

    postDevicesTargetTemperatureHigh(di, payload) {
        return this.postDeviceResource(di, 'targetTemperatureHigh', payload);
    }

    getDevicesTargetTemperatureLow(di) {
        return this.getDeviceResource(di, 'targetTemperatureLow');
    }

    postDevicesTargetTemperatureLow(di, payload) {
        return this.postDeviceResource(di, 'targetTemperatureLow', payload);
    }

    getDevicesAwayMode(di) {
        return this.getDeviceResource(di, 'awayMode');
    }

    postDevicesAwayMode(di, payload) {
        return this.postDeviceResource(di, 'awayMode', payload);
    }

    getDevicesAwayTemperatureHigh(di) {
        return this.getDeviceResource(di, 'awayTemperatureHigh');
    }

    postDevicesAwayTemperatureHigh(di, payload) {
        return this.postDeviceResource(di, 'awayTemperatureHigh', payload);
    }

    getDevicesAwayTemperatureLow(di) {
        return this.getDeviceResource(di, 'awayTemperatureLow');
    }

    postDevicesAwayTemperatureLow(di, payload) {
        return this.postDeviceResource(di, 'awayTemperatureLow', payload);
    }

    getDevicesEcoMode(di) {
        return this.getDeviceResource(di, 'ecoMode');
    }

    getDevicesHvacMode(di) {
        return this.getDeviceResource(di, 'hvacMode');
    }

    postDevicesHvacMode(di, payload) {
        return this.postDeviceResource(di, 'hvacMode', payload);
    }

    getDevicesHeatingFuelSource(di) {
        return this.getDeviceResource(di, 'heatingFuelSource');
    }

    getDevicesHasFan(di) {
        return this.getDeviceResource(di, 'hasFan');
    }

    getDevicesFanActive(di) {
        return this.getDeviceResource(di, 'fanActive');
    }

    getDevicesFanTimerActive(di) {
        return this.getDeviceResource(di, 'fanTimerActive');
    }

    getDevicesFanTimerTimeout(di) {
        return this.getDeviceResource(di, 'fanTimerTimeout');
    }

    postDevicesFanTimerTimeout(di, payload) {
        return this.postDeviceResource(di, 'fanTimerTimeout', payload);
    }

    getDevicesFanMode(di) {
        return this.getDeviceResource(di, 'fanMode');
    }

    postDevicesFanMode(di, payload) {
        return this.postDeviceResource(di, 'fanMode', payload);
    }

    postSubscribe(subscriptionInfo) {
        return this.insteonHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return this.insteonHub._unsubscribe(subscriptionInfo);
    }

    // Helper method to convert the translator schema to the device schema.
    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema) {

        // build the object with desired state
        var result = {};
        switch (resourceId) {
            case 'n':
                result['DeviceName'] = resourceSchema.n;
                break;
            case 'adjustTemperature':
            case 'targetTemperature':
                return this.insteonHub.getDeviceDetailsAsync(this.controlId).then((providerSchema) => {
                    if (providerSchema.mode === 'off') {
                        throw new OpenT2TError(444, "Insteon thermostat is off.");
                    }

                    if (resourceId == 'adjustTemperature')
                    {
                        var currentUnits = getUnitSafe(providerSchema, 'f');
                        resourceSchema.units = isDefined(resourceSchema, 'units') ? resourceSchema.units.substr(0, 1).toLowerCase() : currentUnits;

                        var heatPoint = providerSchema.hasOwnProperty('heat_point') ? providerSchema.heat_point : providerSchema.cool_point;
                        var coolPoint = providerSchema.hasOwnProperty('cool_point') ? providerSchema.cool_point : providerSchema.heat_point;
                        var currentTemp = providerSchema.mode === 'heat' ? heatPoint : (providerSchema.mode === 'cool' ? coolPoint : (heatPoint + coolPoint) / 2);

                        resourceSchema.temperature = currentTemp + convertTemperatureIncrement(resourceSchema.temperature, resourceSchema.units, currentUnits);
                        resourceSchema.units = currentUnits;
                    }
                    
                    switch (providerSchema.mode) {
                        case 'heat':
                            return getTargetTemperatureLow(resourceSchema, providerSchema);
                        case 'cool':
                            return getTargetTemperatureHigh(resourceSchema, providerSchema);
                        case 'auto':
                            return getTargetTemperatureRange(resourceSchema, providerSchema);
                    }
                });
            case 'targetTemperatureHigh':
                result.command = 'set_cool_to';
                result.temp = resourceSchema.temperature;
                break;
            case 'targetTemperatureLow':
                result.command = 'set_heat_to';
                result.temp = resourceSchema.temperature;
                break;
            case 'fanMode':
                result.command = resourceSchema.modes[0] === 'on' ? 'fan_on' : 'fan_auto';
                break;
            case 'hvacMode':
                result.command = translatorHvacModeToDeviceHvacMode(resourceSchema.modes[0]);
                break;
            case 'humidity':
                throw new OpenT2TError(403, InsteonConstants.ResourceNotMutable);
            case 'awayTemperatureHigh':
            case 'awayTemperatureLow':
            case 'heatingFuelSource':
            case 'fanTimerActive':
            case 'fanTimerTimeout':
            case 'awayMode':
            case 'ecoMode':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
            default:
                throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
        }

        return Promise.resolve(result);
    }
}

// Export the translator from the module.
module.exports = Translator;