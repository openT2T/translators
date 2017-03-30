'use strict';

var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var InsteonConstants = require('./constants');
var crypto = require('crypto');
var OpenT2TLogger = require('opent2t').Logger;

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
    var supportedHvacModes = [ 'auto', 'on' ];
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

    var max = providerSchema['cool_point'];
    var min = providerSchema['heat_point'];
    var temperatureUnits = providerSchema['unit'] === undefined ? undefined : providerSchema['unit'].toUpperCase();

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: providerSchema['ambient'],
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
    
    // remove the '%' sign at the end the providerSchema for humidity
    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: providerSchema['humidity'] === undefined ? undefined : Number(providerSchema['humidity'].slice(0, -1))
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(providerSchema));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['fan'] !== undefined
    });

    var PlatformSchema =  {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-insteon-thermostat',
            controlId: providerSchema['DeviceID']
        },
        availability: providerSchema['Reachable'] ? 'online' : 'offline',
        pi: generateGUID( providerSchema['DeviceID'] ),
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
                di: ( providerSchema['DeviceID'] + 'opent2t.d.thermostat'),
                resources: [
                    ambientTemperature,
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
    
    if( providerSchema['fan'] !== undefined ) {
        var fanMode = createResource('oic.r.mode', 'oic.if.a', 'fanMode', expand, readFanMode(providerSchema));
        PlatformSchema.entities[0].resources.push(fanMode);
    }
    return PlatformSchema;
}

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    switch (resourceId) {
        case 'n':
            result['DeviceName'] = resourceSchema.n;
            break;
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
            result.command = translatorHvacModeToDeviceHvacMode( resourceSchema.modes[0] );
            break;
        case 'humidity':
        case 'targetTemperature':
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

    return result;
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

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(deviceInfo, logLevel = "info") {
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
        this.ConsoleLogger.info('Insteon Thermostat initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.insteonHub = deviceInfo.hub;

        this.ConsoleLogger.info('Insteon Thermostat initializing...Done');
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
        if (di === generateGUID( this.controlId + 'opent2t.d.thermostat' )) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.insteonHub.putDeviceDetailsAsync(this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
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
        return this.insteonHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return this.insteonHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;
