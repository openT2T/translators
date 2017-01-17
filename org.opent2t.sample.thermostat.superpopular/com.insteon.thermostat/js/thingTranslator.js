'use strict';
var crypto = require('crypto');

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
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Insteon' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
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
        humidity: providerSchema['humidity'] === undefined ? undefined : providerSchema['humidity'].slice(0, -1)
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(providerSchema));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['fan'] !== undefined
    });

    var guid = generateGUID( providerSchema['DeviceID'] );
    
    var PlatformSchema =  {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-insteon-thermostat',
            controlId: providerSchema['DeviceID']
        },
        pi: guid,
        mnmn: 'Undefined',
        mnmo: 'Undefined',
        n: providerSchema['DeviceName'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.thermostat'],
                di: guid,
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
        var fanMode = createResource('oic.r.sensor', 'oic.if.s', 'fanMode', expand, readFanMode(providerSchema));
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
            throw new Error('NotMutable');
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'heatingFuelSource':
        case 'fanTimerActive':
        case 'fanTimerTimeout':
        case 'awayMode':
        case 'ecoMode':
            throw new Error('NotImplemented');
        default:
            throw new Error('NotFound');
    }

    return result;
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'heatingFuelSource':
        case 'fanTimerActive':
        case 'fanTimerTimeout':
        case 'awayMode':
        case 'ecoMode':
            throw new Error('NotImplemented');
    }
}

function findResource(schema, di, resourceId) {
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) {
        throw new Error('NotFound');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new Error('NotFound');
    }

    return resource;
}

function getDeviceResource(translator, di, resourceId) {
    validateResourceGet(resourceId);
    return translator.get(true)
        .then(response => {
            return findResource(response, di, resourceId);
        });
}

function postDeviceResource(di, resourceId, payload) {
    if (di === generateGUID(controlId)) {
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return insteonHub.putDeviceDetailsAsync(controlId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response, true);
                return findResource(schema, di, resourceId);
            });
    } else {
        throw new Error('NotFound');
    }
}

var controlId;
var insteonHub;

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {

    constructor(deviceInfo) {
        console.log('Insteon Thermostat initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        insteonHub = deviceInfo.hub;

        console.log('Insteon Thermostat initializing...Done');
    }

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return insteonHub.getDeviceDetailsAsync(controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    getDevicesAmbientTemperature(di) {
        return getDeviceResource(this, di, 'ambientTemperature');
    }

    getDevicesTargetTemperature(di) {
        return getDeviceResource(this, di, 'targetTemperature');
    }

    postDevicesTargetTemperature(di, payload) {
        return postDeviceResource(di, 'targetTemperature', payload);
    }

    getDevicesHumidity(di) {
        return getDeviceResource(this, di, 'humidity');
    }

    getDevicesTargetTemperatureHigh(di) {
        return getDeviceResource(this, di, 'targetTemperatureHigh');
    }

    postDevicesTargetTemperatureHigh(di, payload) {
        return postDeviceResource(di, 'targetTemperatureHigh', payload);
    }

    getDevicesTargetTemperatureLow(di) {
        return getDeviceResource(this, di, 'targetTemperatureLow');
    }

    postDevicesTargetTemperatureLow(di, payload) {
        return postDeviceResource(di, 'targetTemperatureLow', payload);
    }

    getDevicesAwayMode(di) {
        return getDeviceResource(this, di, 'awayMode');
    }

    postDevicesAwayMode(di, payload) {
        return postDeviceResource(di, 'awayMode', payload);
    }

    getDevicesAwayTemperatureHigh(di) {
        return getDeviceResource(this, di, 'awayTemperatureHigh');
    }

    postDevicesAwayTemperatureHigh(di, payload) {
        return postDeviceResource(di, 'awayTemperatureHigh', payload);
    }

    getDevicesAwayTemperatureLow(di) {
        return getDeviceResource(this, di, 'awayTemperatureLow');
    }

    postDevicesAwayTemperatureLow(di, payload) {
        return postDeviceResource(di, 'awayTemperatureLow', payload);
    }

    getDevicesEcoMode(di) {
        return getDeviceResource(this, di, 'ecoMode');
    }

    getDevicesHvacMode(di) {
        return getDeviceResource(this, di, 'hvacMode');
    }

    postDevicesHvacMode(di, payload) {
        return postDeviceResource(di, 'hvacMode', payload);
    }

    getDevicesHeatingFuelSource(di) {
        return getDeviceResource(this, di, 'heatingFuelSource');
    }

    getDevicesHasFan(di) {
        return getDeviceResource(this, di, 'hasFan');
    }

    getDevicesFanActive(di) {
        return getDeviceResource(this, di, 'fanActive');
    }

    getDevicesFanTimerActive(di) {
        return getDeviceResource(this, di, 'fanTimerActive');
    }

    getDevicesFanTimerTimeout(di) {
        return getDeviceResource(this, di, 'fanTimerTimeout');
    }

    postDevicesFanTimerTimeout(di, payload) {
        return postDeviceResource(di, 'fanTimerTimeout', payload);
    }

    getDevicesFanMode(di) {
        return getDeviceResource(this, di, 'fanMode');
    }

    postDevicesFanMode(di, payload) {
        return postDeviceResource(di, 'fanMode', payload);
    }

    postSubscribe(subscriptionInfo) {
        return insteonHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return insteonHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;
