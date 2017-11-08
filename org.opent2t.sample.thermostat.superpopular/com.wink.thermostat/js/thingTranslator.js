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
    var guid = crypto.createHash('sha1').update('Wink' + stringID).digest('hex');
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

// Wink does not always populate every desired_state property, but last_reading doesn't necessarily
// update as soon as we send our PUT request. Instead of relying just on one state or the other,
// we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
// if it is not.
class StateReader {
    constructor(desired_state, last_reading) {
        this.desired_state = desired_state;
        this.last_reading = last_reading;
    }

    get(state) {
        if (this.desired_state[state] !== undefined) {
            return this.desired_state[state];
        } else {
            return this.last_reading[state];
        }
    }
}

var deviceHvacModeToTranslatorHvacModeMap = {
    'cool_only': 'coolOnly',
    'heat_only': 'heatOnly',
    'auto': 'auto'
}

var translatorHvacModeToDeviceHvacModeMap = {
    'coolOnly': 'cool_only',
    'heatOnly': 'heat_only',
    'auto': 'auto'
}

function deviceHvacModeToTranslatorHvacMode(mode) {
    return deviceHvacModeToTranslatorHvacModeMap[mode];
}

function translatorHvacModeToDeviceHvacMode(mode) {
    return translatorHvacModeToDeviceHvacModeMap[mode];
}

function deviceSupportedModesToTranslatorSupportedModes(deviceSupportedModes) {
    var supportedModes = deviceSupportedModes.map(deviceHvacModeToTranslatorHvacMode);
    return supportedModes.filter((m) => !!m);
}

function readHvacMode(stateReader) {
    var supportedHvacModes = deviceSupportedModesToTranslatorSupportedModes(stateReader.get('modes_allowed'))
    var hvacMode = deviceHvacModeToTranslatorHvacMode(stateReader.get('mode'));
    var powered = stateReader.get('powered');

    supportedHvacModes.push('off');
    if (!powered) {
        hvacMode = 'off';
    }

    return {
        supportedModes: supportedHvacModes,
        modes: [hvacMode]
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
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);

    // according to Wink docs the temperature is always returned as C 
    // state reader shows a 'units' field, return the result in this unit if it exists
    var units = stateReader.get('units');
    var temperatureUnits = isDefined(units, 'temperature') ? units.temperature.toLowerCase() : 'c';

    var max = temperatureUnits === 'f' ? convertTemperatureAbsolute(stateReader.get('max_set_point'), 'c', 'f') : stateReader.get('max_set_point');
    var min = temperatureUnits === 'f' ? convertTemperatureAbsolute(stateReader.get('min_set_point'), 'c', 'f') : stateReader.get('min_set_point');

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: temperatureUnits === 'f' ? convertTemperatureAbsolute(stateReader.get('temperature'), 'c', 'f') : stateReader.get('temperature'),
        units: temperatureUnits
    });
    
    var adjustTemperature = createResource('oic.r.temperature', 'oic.if.a', 'adjustTemperature', expand, {
        temperature: 0,
        units: temperatureUnits
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: (max + min) / 2,
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

    var awayMode = createResource('oic.r.mode', 'oic.if.a', 'awayMode', expand, {
        modes: [stateReader.get('users_away') ? 'away' : 'home'],
        supportedModes: ['home', 'away']
    });

    var ecoMode = createResource('oic.r.sensor', 'oic.if.s', 'ecoMode', expand, {
        value: stateReader.get('eco_target')
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(stateReader));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: stateReader.get('has_fan')
    });

    var fanActive = createResource('oic.r.sensor', 'oic.if.s', 'fanActive', expand, {
        value: stateReader.get('fan_timer_active')
    });

    return {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-wink-thermostat',
            controlId: providerSchema.thermostat_id
        },
        availability: stateReader.get('connection') ? 'online' : 'offline',
        pi: providerSchema['uuid'],
        mnmn: defaultValueIfEmpty(providerSchema['device_manufacturer'], "Wink"),
        mnmo: defaultValueIfEmpty(providerSchema['manufacturer_device_model'], "Thermostat (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['opent2t.d.thermostat'],
                di: generateGUID(providerSchema.thermostat_id + 'opent2t.d.thermostat'),
                resources: [
                    ambientTemperature,
                    adjustTemperature,
                    targetTemperature,
                    targetTemperatureHigh,
                    targetTemperatureLow,
                    awayMode,
                    ecoMode,
                    hvacMode,
                    hasFan,
                    fanActive
                ]
            }
        ]
    };
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'humidity':
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'heatingFuelSource':
        case 'fanTimerActive':
        case 'fanTimerTimeout':
        case 'fanMode':
            throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }
}

/**
 * If the user provides a unit, validate the value is within the units range.
 *  Range is defined by min/max_min/max_set_point if available, otherwise:
 *    c [9-32]
 *    f [50-90]
 * 
 * If the unit is provided and within range, returns provided unit 
 *  otherwise an exception is thrown.
 * 
 * If no unit is provided and the value is within one of the two ranges,
 *  the unit of the valid range will be returned, otherwise an 
 *  exception is thrown.
 *  * 
 * @param {*} resourceSchema 
 * @param {*} providerSchema 
 */
function getValidatedUnit(resourceSchema, stateReader) {
    var value = resourceSchema.temperature;
    if (!value) {
        throw new OpenT2TError("Invalid target temperature " + value);
    } 
    if (isDefined(resourceSchema, 'units')) {
        var unit = resourceSchema.units.toLowerCase();
        value = unit === 'c' ? value : convertTemperatureAbsolute(value, 'f', 'c');
        var min = getMinTemperatureLow(stateReader);
        var max = getMaxTemperatureHigh(stateReader);
        if (value >= min && value <= max) {
            return unit;
        }
        throw new OpenT2TError(440, "Invalid temperature (" + value + ") for unit (c [" + min + ", " + max + "])");
    } else {
        var min_c = getMinTemperatureLow(stateReader);
        var max_c = getMaxTemperatureHigh(stateReader);
        if (value >= min_c && value <= max_c) {
            return 'c';
        }
        var min_f = convertTemperatureAbsolute(min_c, 'c', 'f');
        var max_f = convertTemperatureAbsolute(max_c, 'c', 'f');;
        if (value >= min_f && value <= max_f) {
            return 'f';
        }
        throw new OpenT2TError(440, "Temperature outside supported range (" + value + ")");
    }
}

/**
 * Given a target temperature, compute a target 
 * low and target high centerd around it.
 * @param {*} resourceSchema 
 * @param {*} stateReader 
 */
function getTargetTemperatureRange(resourceSchema, stateReader) {
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    var value = resourceSchema.temperature;
    var unit = getValidatedUnit(resourceSchema, stateReader);
    if (unit === 'f') {
        value = convertTemperatureAbsolute(value, 'f', 'c');
    }

    var min_low = getMinTemperatureLow(stateReader);
    var min_high = getMinTemperatureHigh(stateReader);

    var max_low = getMaxTemperatureLow(stateReader);
    var max_high = getMaxTemperatureHigh(stateReader);

    var minSetPoint = getMinSetPoint(stateReader);
    var maxSetPoint = getMaxSetPoint(stateReader);

    var range = maxSetPoint - minSetPoint;
    var halfRange = range / 2;
    var newMinSetPoint = value - halfRange;
    var newMaxSetPoint = value + halfRange;

    // If either value is outside min/max range, adjust accordingly
    if (newMinSetPoint < min_low) {
        newMinSetPoint = min_low;
        newMaxSetPoint = min_low + range;
    }

    if (newMinSetPoint > min_high) {
        newMinSetPoint = min_high;
        newMaxSetPoint = min_high + range;
    }

    if (newMaxSetPoint > max_high) {
        newMaxSetPoint = max_high;
        newMinSetPoint = Math.max(min_low, max_high - range);
    }

    if (newMaxSetPoint < max_low) {
        newMaxSetPoint = max_low;
        newMinSetPoint = Math.max(min_low, max_low - range);
    }

    desired_state['min_set_point'] = newMinSetPoint;
    desired_state['max_set_point'] = newMaxSetPoint;

    return result;
}

function getMaxTemperatureHigh(stateReader) {
    // highest allowed max set point
    return getNumber(stateReader.get("max_max_set_point"), 32);
}

function getMaxTemperatureLow(stateReader) {
    // lowest allowed max set point
    return getNumber(stateReader.get("min_max_set_point"), 9);
}

function getMinTemperatureHigh(stateReader) {
    // highest allowed min set point
    return getNumber(stateReader.get("max_min_set_point"), 32);
}

function getMinTemperatureLow(stateReader) {
    // lowest allowed max set point
    return getNumber(stateReader.get("min_min_set_point"), 9);
}

function getMinSetPoint(stateReader) {
    // min set point for heating in celsius
    return getNumber(stateReader.get("min_set_point"), 22);
}

function getMaxSetPoint(stateReader) {
    // max set point for cooling in celsius
    return getNumber(stateReader.get("max_set_point"), 22);
}

function convertTemperatureAbsolute(temperature, from, to) {
    if (from === 'c' && to === 'f') {
        return (temperature * 1.8) + 32;
    } else if (from === 'f' && to === 'c') {
        return (temperature - 32) / 1.8;
    }
    return temperature;
}

function convertTemperatureIncrement(temperature, from, to) {
    if (from === 'c' && to === 'f') {
        return temperature * 1.8;
    } else if (from === 'f' && to === 'c') {
        return temperature / 1.8;
    }
    return temperature;
}

function isDefined(object, variable) {
    return object && object[variable];
}

function getNumber(value, defaultValue) {
    return value ? value : defaultValue;
}

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-wink-thermostat";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.winkHub = deviceInfo.hub;
        this.deviceType = 'thermostats';

        this.logger.info('Wink Thermostat Translator initialized.');
    }

    /**
     * Queries the entire state of the thermostat
     * and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
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
                    return this.winkHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload)
                        .then((response) => {
                            var schema = providerSchemaToPlatformSchema(response.data, true);
                            if (resourceId === 'targetTemperature' || resourceId === 'adjustTemperature') {
                                var low = findResource(schema, di, 'targetTemperatureLow');
                                var high = findResource(schema, di, 'targetTemperatureHigh');
                                var hvacMode = findResource(schema, di, 'hvacMode');
                                return { low, high, hvacMode };
                            } else {
                                return findResource(schema, di, resourceId);
                            }
                        });
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
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub._unsubscribe(subscriptionInfo);
    }

    // Helper method to convert the translator schema to the device schema.
    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema) {

        // build the object with desired state
        var result = { 'desired_state': {} };
        var desired_state = result.desired_state;

        // Quirks:
        // Wink does not have a target temperature field, so ignoring that resource.
        // See: http://docs.winkapiv2.apiary.io/#reference/device/thermostats
        // Instead, we infer it from the max and min setpoint
        // Wink has a separate 'powered' property rather than 'off' being part of the 'mode' property

        switch (resourceId) {
            case 'adjustTemperature':
            case 'targetTemperature':
                return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId).then((providerSchema) => {
                    var stateReader = new StateReader(providerSchema.data.desired_state, providerSchema.data.last_reading);
                    if (stateReader.get('eco_target')) {
                        throw new OpenT2TError(448, "Wink thermostat is in eco mode.");
                    }
                    var mode = stateReader.get('mode');
                    if (mode === 'off') {
                        throw new OpenT2TError(444, "Wink thermostat is off.");
                    }

                    if (resourceId === 'adjustTemperature')
                    {
                        resourceSchema.units = resourceSchema.hasOwnProperty('units') ? resourceSchema.units.substr(0, 1).toLowerCase() : 'f';
                        
                        var currentTemp = (stateReader.get('max_set_point') + stateReader.get('min_set_point')) / 2;

                        resourceSchema.temperature = currentTemp + convertTemperatureIncrement(resourceSchema.temperature, resourceSchema.units, 'c');
                        resourceSchema.units = 'c';
                    }

                    if (mode === 'auto') {
                        return getTargetTemperatureRange(resourceSchema, stateReader);
                    } else {                        
                        var result = { 'desired_state': {} };
                        var desired_state = result.desired_state;

                        desired_state['max_set_point'] = convertTemperatureAbsolute(resourceSchema.temperature, resourceSchema.units, 'c');
                        desired_state['min_set_point'] = convertTemperatureAbsolute(resourceSchema.temperature, resourceSchema.units, 'c');

                        return result;
                    }
                });
            case 'targetTemperatureHigh':
                if (resourceSchema.hasOwnProperty('units') && resourceSchema.units.substr(0, 1).toLowerCase() === 'f') {
                    desired_state['max_set_point'] = convertTemperatureAbsolute(resourceSchema.temperature, 'f', 'c');
                } else {
                    desired_state['max_set_point'] = resourceSchema.temperature;
                }
                break;
            case 'targetTemperatureLow':
                if (resourceSchema.hasOwnProperty('units') && resourceSchema.units.toLowerCase() === 'f') {
                    desired_state['min_set_point'] = convertTemperatureAbsolute(resourceSchema.temperature, 'f', 'c');
                } else {
                    desired_state['min_set_point'] = resourceSchema.temperature;
                }
                break;
            case 'awayMode':
                desired_state['users_away'] = resourceSchema.modes[0] === 'away';
                break;
            case 'hvacMode': {
                var mode = resourceSchema.modes[0];
                if (mode === 'off') {
                    desired_state['powered'] = false;
                }
                else {
                    desired_state['powered'] = true;
                    desired_state['mode'] = translatorHvacModeToDeviceHvacMode(mode);
                }
                break;
            }
            case 'awayTemperatureHigh':
            case 'awayTemperatureLow':
            case 'fanTimerTimeout':
            case 'fanMode':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
            default:
                throw new OpenT2TError(404, OpenT2TConstants.ResourceNotFound);
        }

        return Promise.resolve(result);
    }

}

// Export the translator from the module.
module.exports = Translator;