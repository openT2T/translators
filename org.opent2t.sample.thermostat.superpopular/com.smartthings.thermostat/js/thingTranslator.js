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

function deviceSupportedModesToTranslatorSupportedModes(deviceSupportedModes) {
    var supportedModes = deviceSupportedModes.map((x) => {
        return x.toLowerCase();
    });
    return supportedModes.filter((m) => !!m);
}

var deviceHvacModeToTranslatorHvacModeMap = {
    'cool': 'coolOnly',
    'heat': 'heatOnly',
    'emergency heat': 'heatOnly',
    'auto': 'auto',
    'off': 'off'
}

var translatorHvacModeToDeviceHvacModeMap = {
    'coolOnly': 'cool',
    'heatOnly': 'heat',
    'auto': 'auto',
    'off': 'off'
}

function deviceHvacModeToTranslatorHvacMode(mode) {
    return deviceHvacModeToTranslatorHvacModeMap[mode];
}

function translatorHvacModeToDeviceHvacMode(mode) {
    return translatorHvacModeToDeviceHvacModeMap[mode];
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

    var attributes = providerSchema.attributes;

    var max = getIntSafe(attributes.coolingSetpoint, 0);
    var min = getIntSafe(attributes.heatingSetpoint, 0);

    // TODO: deviceTemperatureUnits is the units displayed on the device
    // temperatureScale is the value of the variables - we should
    // convert and return the values to deviceTemperatureUnits
    var temperatureUnits = getUnitSafe(attributes);

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: getIntSafe(attributes.temperature, 0),
        units: temperatureUnits
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: attributes.thermostatMode === 'auto' ? ((max + min) / 2) : getIntSafe(attributes.thermostatSetpoint, 0),
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
        modes: [providerSchema['locationMode'].mode.toLowerCase()],
        supportedModes: deviceSupportedModesToTranslatorSupportedModes(providerSchema['locationMode'].supported)
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, {
        supportedModes: ['coolOnly', 'heatOnly', 'auto', 'off'],
        modes: [deviceHvacModeToTranslatorHvacMode(attributes.thermostatMode)]
    });

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: attributes.thermostatFanMode ? true : false
    });

    var fanMode = createResource('oic.r.mode', 'oic.if.s', 'fanMode', expand, {
        supportedModes: ['auto', 'on'],
        modes: [attributes.thermostatFanMode]
    });

    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: attributes.humidity
    });

    return {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-smartthings-thermostat',
            controlId: providerSchema['id'],
            endpointUri: providerSchema['endpointUri']
        },
        availability: providerSchema['status'] === 'ONLINE' || providerSchema['status'] === 'ACTIVE' ? 'online' : 'offline',
        pi: providerSchema['id'],
        mnmn: defaultValueIfEmpty(providerSchema['manufacturer'], "SmartThings"),
        mnmo: defaultValueIfEmpty(providerSchema['model'], "Thermostat (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['opent2t.d.thermostat'],
                di: generateGUID(providerSchema['id'] + 'opent2t.d.thermostat'),
                resources: [
                    ambientTemperature,
                    targetTemperature,
                    targetTemperatureHigh,
                    targetTemperatureLow,
                    awayMode,
                    hvacMode,
                    hasFan,
                    fanMode,
                    humidity
                ]
            }
        ]
    };
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'ecoMode':
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'heatingFuelSource':
        case 'fanTimerActive':
        case 'fanTimerTimeout':
        case 'fanActive':
            throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }
}

/**
 * If the user provides a unit, validate the value is within the units range.
 *  Range is defined by [min/max][Heating/Cooling]SetPoint if available, otherwise:
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
function getValidatedUnit(resourceSchema, attributes) {
    var value = resourceSchema.temperature;
    var providerUnit = getUnitSafe(attributes);
    var min = getMinHeatingSetpoint(attributes);
    var max = getMaxCoolingSetpoint(attributes);
    if (isDefined(resourceSchema, 'units')) {
        var unit = resourceSchema.units.toLowerCase();
        if (unit === 'c' && providerUnit === 'f') {
            value = celsiusToFahrenheit(value);
        } else if (unit === 'f' && providerUnit === 'c') {
            value = fahrenheitToCelsius(value);
        }
        if (value >= min && value <= max) {
            return unit;
        }
        throw new OpenT2TError(440, "Invalid temperature (" + value + ") for unit (" + unit + "[" + min + ", " + max + "])");
    } else {
        if (value >= min && value <= max) {
            return providerUnit;
        }
        if (providerUnit === 'c') {
            min = celsiusToFahrenheit(min);
            max = celsiusToFahrenheit(max);
            if (value >= min && value <= max) {
                return 'f';
            }
        } else if (providerUnit === 'f') {
            min = fahrenheitToCelsius(min);
            max = fahrenheitToCelsius(max);
            if (value >= min && value <= max) {
                return 'c';
            }
        }
        throw new OpenT2TError(440, "Temperature outside supported range (" + value + ")");
    }
}

/**
 * Given a target temperature, compute a target 
 * low and target high centered around it.
 * @param {*} resourceSchema 
 * @param {*} stateReader 
 */
function getTargetTemperatureRange(resourceSchema, attributes) {

    var unit = getValidatedUnit(resourceSchema, attributes);
    var providerUnit = getUnitSafe(attributes);

    var value = resourceSchema.temperature;
    if (unit === 'c' && providerUnit === 'f') {
        value = celsiusToFahrenheit(value);
    } else if (unit === 'f' && providerUnit === 'c') {
        value = fahrenheitToCelsius(value);
    }

    // cooling = temperatureHigh
    var minTemperatureHigh = getMinCoolingSetpoint(attributes);
    var maxTemperatureHigh = getMaxCoolingSetpoint(attributes);

    // heating = temperatureLow
    var minTemperatureLow = getMinHeatingSetpoint(attributes);
    var maxTemperatureLow = getMaxHeatingSetpoint(attributes);

    var targetTemperatureHigh = getIntSafe(attributes.coolingSetpoint, 0);
    var targetTemperatureLow = getIntSafe(attributes.heatingSetpoint, 0);

    var range = targetTemperatureHigh - targetTemperatureLow;
    var halfRange = range / 2;
    var newTargetTemperatureHigh = value + halfRange;
    var newTargetTemperatureLow = value - halfRange;

    // If either value is outside min/max range, adjust accordingly
    if (newTargetTemperatureLow < minTemperatureLow) {
        newTargetTemperatureLow = minTemperatureLow;
        newTargetTemperatureHigh = minTemperatureLow + range;
    }

    if (newTargetTemperatureLow > maxTemperatureLow) {
        newTargetTemperatureLow = maxTemperatureLow;
        newTargetTemperatureHigh = maxTemperatureLow + range;
    }

    if (newTargetTemperatureHigh > maxTemperatureHigh) {
        newTargetTemperatureHigh = maxTemperatureHigh;
        newTargetTemperatureLow = Math.max(minTemperatureLow, maxTemperatureHigh - range);
    }

    if (newTargetTemperatureHigh < minTemperatureHigh) {
        newTargetTemperatureHigh = minTemperatureHigh;
        newTargetTemperatureLow = Math.max(minTemperatureLow, minTemperatureHigh - range);
    }

    var response = {};
    var command = {}

    response['temperature_scale'] = providerUnit;
    response['thermostatMode'] = attributes.thermostatMode;

    command['coolingSetpoint'] = newTargetTemperatureHigh;
    command['heatingSetpoint'] = newTargetTemperatureLow;

    return { response, command };
}

function getTargetTemperature(resourceSchema, attributes) {

    var unit = getValidatedUnit(resourceSchema, attributes);
    var providerUnit = getUnitSafe(attributes);

    var value = resourceSchema.temperature;
    if (unit === 'c' && providerUnit === 'f') {
        value = celsiusToFahrenheit(value);
    } else if (unit === 'f' && providerUnit === 'c') {
        value = fahrenheitToCelsius(value);
    }

    var response = {};
    var command = {}

    response['temperature_scale'] = providerUnit; // not used - units comes back from hub
    response['thermostatMode'] = attributes.thermostatMode;

    command['thermostatSetpoint'] = value;

    return { response, command };
}

function getMaxHeatingSetpoint(attributes) {
    return getIntSafe(attributes.maxHeatingSetpoint, (getUnitSafe(attributes) === 'f' ? 50 : 9));
}

function getMinHeatingSetpoint(attributes) {
    return getIntSafe(attributes.minHeatingSetpoint, (getUnitSafe(attributes) === 'f' ? 50 : 9));
}

function getMaxCoolingSetpoint(attributes) {
    return getIntSafe(attributes.maxCoolingSetpoint, (getUnitSafe(attributes) === 'f' ? 90 : 32));
}

function getMinCoolingSetpoint(attributes) {
    return getIntSafe(attributes.minCoolingSetpoint, (getUnitSafe(attributes) === 'f' ? 90 : 32));
}

/**
 * SmartThings attributes can be strings, check for existence and return as int
 * @param {*} i 
 */

function getIntSafe(i, defaultValue) {
    return i !== undefined && i != null ? parseInt(i) : defaultValue;
}

function getUnitSafe(attributes) {
    return attributes.hasOwnProperty('temperatureScale') ?
        attributes.temperatureScale.toLowerCase() : 'c';
}

function celsiusToFahrenheit(c) {
    return (c * 1.8) + 32;
}

function fahrenheitToCelsius(f) {
    return (f - 32) / 1.8;
}

function isDefined(object, variable) {
    return object && object[variable];
}

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-smartthings-thermostat";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.endpointUri = deviceInfo.deviceInfo.opent2t.endpointUri;
        this.smartThingsHub = deviceInfo.hub;

        this.logger.info('SmartThings Thermostat initializing...Done');
    }

    /**
     * Queries the entire state of the thermostat
     * and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
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
                    if (resourceId === 'targetTemperature') {
                        return this.smartThingsHub.putDeviceDetailsAsync(this.endpointUri, this.controlId, putPayload.command).then((response) => {
                            Object.assign(response, putPayload.response);
                            var schema = providerSchemaToPlatformSchema(response, true);
                            // from logs: autocool does not allow changing thermostat setpoint - we'll do target high/low for this case
                            console.log(response.thermostatMode);
                            if (response.thermostatMode === 'auto' ||
                                response.thermostatMode === 'autoheat' ||
                                response.thermostatMode === 'autocool') {
                                var low = findResource(schema, di, 'targetTemperatureLow');
                                var high = findResource(schema, di, 'targetTemperatureHigh');
                                var hvacMode = findResource(schema, di, 'hvacMode');
                                var result = { low, high, hvacMode };
                                return result;
                            } else {
                                return findResource(schema, di, resourceId);
                            }
                        });

                    } else {
                        return this.smartThingsHub.putDeviceDetailsAsync(this.endpointUri, this.controlId, putPayload).then((response) => {
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
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub._unsubscribe(subscriptionInfo);
    }

    _resourceSchemaToProviderSchemaAsync(resourceId, resourceSchema) {

        // build the object with desired state
        var result = {};

        switch (resourceId) {
            case 'targetTemperature':
                return this.smartThingsHub.getDeviceDetailsAsync(this.endpointUri, this.controlId).then((providerSchema) => {
                    var attributes = providerSchema.attributes;
                    if (attributes.thermostatMode === 'off') {
                        throw new OpenT2TError(444, "SmartThings thermostat is off.");
                    }
                    if (attributes.thermostatMode === 'auto') {
                        return getTargetTemperatureRange(resourceSchema, attributes);
                    } else {
                        return getTargetTemperature(resourceSchema, attributes);
                    }
                });
            case 'targetTemperatureHigh':
                result['coolingSetpoint'] = resourceSchema.temperature;
                break;
            case 'targetTemperatureLow':
                result['heatingSetpoint'] = resourceSchema.temperature;
                break;
            case 'awayMode':
                result['awayMode'] = resourceSchema.modes[0] === 'away' ? 'Away' : 'Home';
                break;
            case 'hvacMode':
                result['hvacMode'] = translatorHvacModeToDeviceHvacMode(resourceSchema.modes[0]);
                break;
            case 'fanMode':
                result['fanMode'] = resourceSchema.modes[0];       //TODO: convert mode?
                break;
            case 'awayTemperatureHigh':
            case 'awayTemperatureLow':
            case 'fanTimerTimeout':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
            default:
                throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
        }

        return Promise.resolve(result);
    }

}

// Export the translator from the module.
module.exports = Translator;