'use strict';

var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var NestConstants = require('./constants');
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
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Nest' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

var deviceHvacModeToTranslatorHvacModeMap = {
    'cool': 'coolOnly',
    'heat': 'heatOnly',
    'heat-cool': 'auto',
    'off': 'off'
}

var translatorHvacModeToDeviceHvacModeMap = {
    'coolOnly': 'cool',
    'heatOnly': 'heat',
    'auto': 'heat-cool',
    'off': 'off'
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

    if (deviceSchema['can_cool']) {
        supportedHvacModes.push('coolOnly');
    }
    if (deviceSchema['can_heat']) {
        supportedHvacModes.push('heatOnly');
    }

    var hvacMode = deviceHvacModeToTranslatorHvacMode(deviceSchema['hvac_mode']);
    if (hvacMode === undefined) deviceHvacModeToTranslatorHvacMode(deviceSchema['hvac_state']);

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

// Helper method to convert the provider schema to the platform schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    // Quirks:
    // - Nest does not have an external temperature field, so that is left out.
    // - Away Mode is not implemented at this time.

    // Get temperature scale
    var ts = providerSchema['temperature_scale'] ? providerSchema['temperature_scale'].toLowerCase() : undefined;
    var targetLow = providerSchema['target_temperature_low_' + ts];
    var targetHigh = providerSchema['target_temperature_high_' + ts];

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: providerSchema['ambient_temperature_' + ts],
        units: ts
    });

    var adjustTemperature = createResource('oic.r.temperature', 'oic.if.a', 'adjustTemperature', expand, {
        temperature: 0,
        units: 'f'
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: providerSchema['hvac_mode'] === 'heat-cool' ? ((targetHigh + targetLow) / 2) : providerSchema['target_temperature_' + ts],
        units: ts
    });

    var targetTemperatureHigh = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureHigh', expand, {
        temperature: targetHigh,
        units: ts
    });

    var targetTemperatureLow = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureLow', expand, {
        temperature: targetLow,
        units: ts
    });

    var awayTemperatureHigh = createResource('oic.r.temperature', 'oic.if.s', 'awayTemperatureHigh', expand, {
        temperature: providerSchema['away_temperature_high_' + ts],
        units: ts
    });

    var awayTemperatureLow = createResource('oic.r.temperature', 'oic.if.s', 'awayTemperatureLow', expand, {
        temperature: providerSchema['away_temperature_low_' + ts],
        units: ts
    });

    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: providerSchema['humidity']
    });

    var awayMode = createResource('oic.r.mode', 'oic.if.a', 'awayMode', expand, {
        modes: [providerSchema['away']],
        supportedModes: ['home', 'away']
    });

    var ecoMode = createResource('oic.r.sensor', 'oic.if.s', 'ecoMode', expand, {
        value: providerSchema['has_leaf']
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(providerSchema));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['has_fan']
    });

    var fanActive = createResource('oic.r.sensor', 'oic.if.a', 'fanActive', expand, {
        value: providerSchema['fan_timer_active']
    });

    var fanTimerActive = createResource('oic.r.sensor', 'oic.if.a', 'fanTimerActive', expand, {
        value: providerSchema['fan_timer_active']
    });

    return {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-nest-thermostat',
            controlId: providerSchema['device_id'],
            structureId: providerSchema['structure_id']
        },
        availability: providerSchema['is_online'] ? 'online' : 'offline',
        pi: generateGUID(providerSchema['device_id']),
        mnmn: 'Nest',
        mnmo: 'Thermostat',
        n: providerSchema['name_long'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                n: providerSchema['name_long'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['opent2t.d.thermostat'],
                di: generateGUID(providerSchema['device_id'] + 'opent2t.d.thermostat'),
                resources: [
                    ambientTemperature,
                    adjustTemperature,
                    targetTemperature,
                    targetTemperatureHigh,
                    targetTemperatureLow,
                    awayTemperatureHigh,
                    awayTemperatureLow,
                    humidity,
                    awayMode,
                    ecoMode,
                    hvacMode,
                    hasFan,
                    fanActive,
                    fanTimerActive
                ]
            }
        ]
    };
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'heatingFuelSource':
        case 'fanMode':
        case 'fanTimerTimeout':
            throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }
}

/**
 * If the user provides a unit, validate the value is within the units range.
 *  Range is defined by Nest as:
 *    c [9-32]
 *    f [50-90]
 *  Unless, is_locked = true, then it will be defined by the locked values.
 * 
 * If the unit is provided and within range, returns provided unit 
 *  otherwise an exception is thrown.
 * 
 * If no unit is provided and the value is within one of the two ranges,
 *  the unit of the valid range will be returned, otherwise an 
 *  exception is thrown.
 * 
 * TODO: Could use the 'temperature_scale' from the thermostat to pick a unit.
 * 
 * @param {*} resourceSchema 
 * @param {*} providerSchema 
 */
function getValidatedUnit(resourceSchema, providerSchema) {
    var value = resourceSchema.temperature;
    if (!value) {
        throw new OpenT2TError("Invalid target temperature " + value);
    }
    if (isDefined(resourceSchema, 'units')) {
        var unit = resourceSchema.units.toLowerCase();
        var min = getMinTemperature(providerSchema, unit);
        var max = getMaxTemperature(providerSchema, unit);
        if (value >= min && value <= max) {
            return unit;
        }
        throw new OpenT2TError(440, "Invalid temperature (" + value + ") for unit (" + unit + " [" + min + ", " + max + "])");
    } else {
        var min_f = getMinTemperature(providerSchema, 'f');
        var max_f = getMaxTemperature(providerSchema, 'f');
        if (value >= min_f && value <= max_f) {
            return 'f';
        }
        var min_c = getMinTemperature(providerSchema, 'c');
        var max_c = getMaxTemperature(providerSchema, 'c');
        if (value >= min_c && value <= max_c) {
            return 'c';
        }
        throw new OpenT2TError(440, "Temperature outside supported range (" + value + ")");
    }
}

/**
 * Given a target temperature, compute a target 
 * low and target high centerd around it.
 * @param {*} resourceSchema 
 * @param {*} providerSchema 
 */
function getTargetTemperatureRange(resourceSchema, providerSchema) {

    var value = resourceSchema.temperature;
    var unit = getValidatedUnit(resourceSchema, providerSchema);
    // In 'c' nest allows *.5, but not for 'f'
    var min = getMinTemperature(providerSchema, unit);
    var max = getMaxTemperature(providerSchema, unit);

    var targetLow = getTargetTemperatureLow(providerSchema, unit);
    var targetHigh = getTargetTemperatureHigh(providerSchema, unit);

    var range = targetHigh - targetLow;
    var halfRange = range / 2;

    if (unit === 'f') {
        // Minimum range set by Nest API if in f
        if (range < 3) {
            range = 3;
        }
        value = Math.round(value); // Must be a whole number
        halfRange = Math.round(halfRange);
    } else if (unit === 'c') {
        // Minimum range set by Nest API if in c
        if (range < 1.5 && unit === 'c') {
            range = 1.5;
        }
        // Value must be either a whole number or .5 increment
        value = roundToHalf(value);
        halfRange = roundToHalf(halfRange);
    }

    // Keeps the range, but may not be perfectly centered over new target
    var newTargetLow = value - halfRange;
    var newTargetHigh = value + (range - halfRange);

    // If either value is outside min/max range, adjust accordingly
    if (newTargetLow < min) {
        newTargetLow = min;
        newTargetHigh = min + range;
    }

    if (newTargetHigh > max) {
        newTargetHigh = max;
        newTargetLow = Math.max(min, max - range);
    }

    var response = {};
    var command = {}

    response['temperature_scale'] = unit;
    response['hvac_mode'] = providerSchema.hvac_mode;

    command['target_temperature_high_' + unit] = newTargetHigh;
    command['target_temperature_low_' + unit] = newTargetLow;

    return { response, command };
}


function getTargetTemperature(resourceSchema, providerSchema) {

    var unit = getValidatedUnit(resourceSchema, providerSchema);

    var response = {};
    var command = {}

    response['temperature_scale'] = unit;
    response['hvac_mode'] = providerSchema.hvac_mode;

    command['target_temperature_' + unit] = resourceSchema.temperature;

    return { response, command };
}

function getTargetTemperatureHigh(providerSchema, unit) {
    if (unit === 'f') {
        return getNumber(providerSchema.target_temperature_high_f, 90);
    } else if (unit === 'c') {
        return getNumber(providerSchema.target_temperature_high_c, 32);
    }
    throw new OpenT2TError(440, "Invalid temperature unit (" + unit + ")");
}

function getTargetTemperatureLow(providerSchema, unit) {
    if (unit === 'f') {
        return getNumber(providerSchema.target_temperature_low_f, 50);
    } else if (unit === 'c') {
        return getNumber(providerSchema.target_temperature_low_c, 9);
    }
    throw new OpenT2TError(440, "Invalid temperature unit (" + unit + ")");
}

function getMinTemperature(providerSchema, unit) {
    if (unit === 'f') {
        return providerSchema.is_locked ? getNumber(providerSchema.locked_temp_min_f, 50) : 50;
    } else if (unit === 'c') {
        return providerSchema.is_locked ? getNumber(providerSchema.locked_temp_min_c, 9) : 9;
    }
    throw new OpenT2TError(440, "Invalid temperature unit (" + unit + ")");
}

function getMaxTemperature(providerSchema, unit) {
    if (unit === 'f') {
        return providerSchema.is_locked ? getNumber(providerSchema.locked_temp_max_f, 90) : 90;
    } else if (unit === 'c') {
        return providerSchema.is_locked ? getNumber(providerSchema.locked_temp_max_c, 32) : 32;
    }
    throw new OpenT2TError(440, "Invalid temperature unit (" + unit + ")");
}

function roundToHalf(value) {
    var rounded = Math.round(value);
    if (value === rounded) // already a whole number
        return value;
    var floor = Math.floor(value);
    var decimal = value - floor;
    if (decimal < 0.25) {
        return floor;
    }
    if (decimal < 0.75) {
        return floor + 0.5;
    }
    return rounded;
}

function isDefined(object, variable) {
    return object && object[variable];
}

function getNumber(value, defaultValue) {
    return value ? value : defaultValue;
}


function convertTemperatureIncrement(temperature, from, to) {
    if (from === 'c' && to === 'f') {
        return temperature * 1.8;
    } else if (from === 'f' && to === 'c') {
        return temperature / 1.8;
    }
    return temperature;
}

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' interface.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-nest-thermostat";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.structureId = deviceInfo.deviceInfo.opent2t.structureId;
        this.nestHub = deviceInfo.hub;
        this.deviceType = 'thermostats';

        this.logger.info('Nest Thermostat initializing...Done');
    }

    /**
     * Queries the entire state of the thermostat
     * and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.nestHub.getDeviceDetailsAsync(this.deviceType, this.controlId)
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
                    if (resourceId === 'awayMode') {
                        return this.nestHub.setAwayMode(this.structureId, this.controlId, putPayload)
                            .then((response) => {
                                var schema = providerSchemaToPlatformSchema(response, true);
                                return findResource(schema, di, resourceId);
                            });
                    } else if (resourceId === 'targetTemperature' || resourceId === 'adjustTemperature') {
                        return this.nestHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload.command).then((response) => {
                            Object.assign(response, putPayload.response);
                            var schema = providerSchemaToPlatformSchema(response, true);
                            switch (response.hvac_mode) {
                                case 'heat':
                                case 'cool':
                                    return findResource(schema, di, resourceId);
                                case 'heat-cool':
                                    var low = findResource(schema, di, 'targetTemperatureLow');
                                    var high = findResource(schema, di, 'targetTemperatureHigh');
                                    var hvacMode = findResource(schema, di, 'hvacMode');
                                    return { low, high, hvacMode };
                            }
                        });
                    } else {
                        return this.nestHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload).then((response) => {
                            // target temperature can become target low and target high if thermostat was in auto mode
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

    getDevicesTargetTemperature(di) {
        return this.getDeviceResource(di, 'targetTemperature');
    }

    /**
     * Target temperature will be set based on the mode of the thermostat
     * In 'heat' or 'cool' -> targetTemperature will be set
     * In 'auto' -> target_low/target_high will be set
     * In 'eco' -> eco_low/eco_high will be set
     * When 'off' -> error
     * @param {*} di 
     * @param {*} payload 
     */
    postDevicesTargetTemperature(di, payload) {
        return this.postDeviceResource(di, 'targetTemperature', payload);
    }

    getDevicesAdjustTemperature(di) {
        return this.getDeviceResource(di, 'adjustTemperature');
    }

    postDevicesAdjustTemperature(di, payload) {
        return this.postDeviceResource(di, 'adjustTemperature', payload);
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
        subscriptionInfo.controlId = this.controlId;
        return this.nestHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        return this.nestHub._unsubscribe(subscriptionInfo);
    }

    /**
     * Convertrs an OCF platform/resource schema to Nest API calls - async.
     */
    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema) {
        // build the object with desired state
        var result = {};
        switch (resourceId) {
            case 'adjustTemperature':
            case 'targetTemperature':
                return this.nestHub.getDeviceDetailsAsync(this.deviceType, this.controlId).then((providerSchema) => {
                    if (providerSchema.hvac_mode === 'eco') {
                        throw new OpenT2TError(448, "Nest thermostat is in eco mode.");
                    }
                    if (providerSchema.hvac_mode === 'off') {
                        throw new OpenT2TError(444, "Nest thermostat is off.");
                    }

                    if (resourceid === 'adjustTemperature') {
                        var currentUnits = providerSchema['temperature_scale'] ? providerSchema['temperature_scale'].substr(0, 1).toLowerCase() : 'f';
                        resourceSchema.units = resourceSchema.units ? resourceSchema.units.substr(0, 1).toLowerCase() : currentUnits;

                        var targetLow = providerSchema['target_temperature_low_' + currentUnits];
                        var targetHigh = providerSchema['target_temperature_high_' + currentUnits];
                        var currentTemp = providerSchema['hvac_mode'] === 'heat-cool' ? ((targetHigh + targetLow) / 2) : providerSchema['target_temperature_' + currentUnits];

                        resourceSchema.temperature = currentTemp + convertTemperatureIncrement(resourceSchema.temperature, resourceSchema.units, currentUnits);
                        resourceSchema.units = currentUnits;
                    }

                    switch (providerSchema.hvac_mode) {
                        case 'heat':
                        case 'cool':
                            return getTargetTemperature(resourceSchema, providerSchema);
                        case 'heat-cool':
                            return getTargetTemperatureRange(resourceSchema, providerSchema);
                    }
                    return result;
                });
            case 'targetTemperatureHigh':
                if (!resourceSchema.units) {
                    throw new OpenT2TError(400, NestConstants.SchemaMissingTemperature);
                }
                result['temperature_scale'] = resourceSchema.units.toLowerCase();
                result['target_temperature_high_' + resourceSchema.units.toLowerCase()] = resourceSchema.temperature;
                break;
            case 'targetTemperatureLow':
                if (!resourceSchema.units) {
                    throw new OpenT2TError(400, NestConstants.SchemaMissingTemperature);
                }
                result['temperature_scale'] = resourceSchema.units.toLowerCase();
                result['target_temperature_low_' + resourceSchema.units.toLowerCase()] = resourceSchema.temperature;
                break;
            case 'hvacMode':
                result['hvac_mode'] = translatorHvacModeToDeviceHvacMode(resourceSchema.modes[0]);
                break;
            case 'fanActive':
            case 'fanTimerActive':
                result['fan_timer_active'] = resourceSchema.value;
                break;
            case 'awayMode':
                result['away'] = resourceSchema.modes[0];
                break;
            case 'ambientTemperature':
            case 'awayTemperatureHigh':
            case 'awayTemperatureLow':
            case 'humidity':
            case 'ecoMode':
            case 'fanTimerTimeout':
                throw new OpenT2TError(403, NestConstants.ResourceNotMutable);
            case 'fanMode':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
            default:
                throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
        }

        return Promise.resolve(result);
    }
}

// Export the translator from the module.
module.exports = Translator;
