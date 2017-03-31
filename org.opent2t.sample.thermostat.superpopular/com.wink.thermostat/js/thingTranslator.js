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

    var max = stateReader.get('max_set_point');
    var min = stateReader.get('min_set_point');

    // according to Wink docs the temperature is always returned as C 
    var temperatureUnits = "c";

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: stateReader.get('temperature'),
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

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    // Quirks:
    // Wink does not have a target temperature field, so ignoring that resource.
    // See: http://docs.winkapiv2.apiary.io/#reference/device/thermostats
    // Instead, we infer it from the max and min setpoint
    // Wink has a separate 'powered' property rather than 'off' being part of the 'mode' property

    switch (resourceId) {
        case 'targetTemperatureHigh':
            desired_state['max_set_point'] = resourceSchema.temperature;
            break;
        case 'targetTemperatureLow':
            desired_state['min_set_point'] = resourceSchema.temperature;
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
        case 'targetTemperature':
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'fanTimerTimeout':
        case 'fanMode':
            throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
        default:
            throw new OpenT2TError(404, OpenT2TConstants.ResourceNotFound);
    }

    return result;
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

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(logger, deviceInfo) {
        this.logger = logger;
        this.logger.info('Initializing device.');

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
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.winkHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response.data, true);

                    return findResource(schema, di, resourceId);
                });
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
        return this.winkHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;