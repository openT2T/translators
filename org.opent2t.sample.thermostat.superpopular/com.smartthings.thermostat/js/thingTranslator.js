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

// Helper method to convert the provider schema to the platform schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    var max = providerSchema['attributes'].coolingSetpoint;
    var min = providerSchema['attributes'].heatingSetpoint;
    var temperatureUnits = providerSchema['attributes'].deviceTemperatureUnit;

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: providerSchema['attributes'].temperature,
        units: temperatureUnits
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: providerSchema['attributes'].thermostatMode === 'auto' ? (max + min) / 2 : providerSchema['attributes'].thermostatSetpoint,
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
        modes: providerSchema['locationMode'].mode.toLowerCase(),
        supportedModes: deviceSupportedModesToTranslatorSupportedModes(providerSchema['locationMode'].supported)
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, {
        supportedModes: ['coolOnly', 'heatOnly', 'auto', 'off'],
        modes: deviceHvacModeToTranslatorHvacMode(providerSchema['attributes'].thermostatMode)
    });

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['attributes'].thermostatFanMode !== undefined && providerSchema['attributes'].thermostatFanMode !== null
    });

    var fanMode = createResource('oic.r.mode', 'oic.if.s', 'fanMode', expand, {
        supportedModes: ['auto', 'on'],
        modes: providerSchema['attributes'].thermostatFanMode
    });

    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: providerSchema['attributes'].humidity
    });

    return {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-smartthings-thermostat',
            controlId: providerSchema['id']
        },
        pi: providerSchema['id'],
        mnmn: validateValue(providerSchema['manufacturer']),
        mnmo: validateValue(providerSchema['model']),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.thermostat'],
                di: providerSchema['id'],
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

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    switch (resourceId) {
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
        case 'targetTemperature':
            result['thermostatSetpoint'] = resourceSchema.temperature;
            break;
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'fanTimerTimeout':
            throw new Error('NotImplemented');
        default:
            throw new Error('NotFound');
    }

    return result;
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
            throw new Error('NotImplemented');
    }
}

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
class Translator {
     
    constructor(deviceInfo) {
        console.log('SmartThings Thermostat initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.smartThingsHub = deviceInfo.hub;

        console.log('SmartThings Thermostat initializing...Done');
    }
    
    /**
     * Queries the entire state of the thermostat
     * and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.smartThingsHub.getDeviceDetailsAsync(this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(translator, di, resourceId) {
        validateResourceGet(resourceId);

        return translator.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
            });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        if (di === this.controlId)
        {
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
    
    getDevicesAmbientTemperature(di) {
        return this.getDeviceResource(this, di, 'ambientTemperature');
    }

    getDevicesTargetTemperature(di) {
        return this.getDeviceResource(this, di, 'targetTemperature');
    }

    postDevicesTargetTemperature(di, payload) {
        return this.postDeviceResource(di, 'targetTemperature', payload);
    }

    getDevicesHumidity(di) {
        return this.getDeviceResource(this, di, 'humidity');
    }

    getDevicesTargetTemperatureHigh(di) {
        return this.getDeviceResource(this, di, 'targetTemperatureHigh');
    }

    postDevicesTargetTemperatureHigh(di, payload) {
        return this.postDeviceResource(di, 'targetTemperatureHigh', payload);
    }

    getDevicesTargetTemperatureLow(di) {
        return this.getDeviceResource(this, di, 'targetTemperatureLow');
    }

    postDevicesTargetTemperatureLow(di, payload) {
        return this.postDeviceResource(di, 'targetTemperatureLow', payload);
    }

    getDevicesAwayMode(di) {
        return this.getDeviceResource(this, di, 'awayMode');
    }

    postDevicesAwayMode(di, payload) {
        return this.postDeviceResource(di, 'awayMode', payload);
    }

    getDevicesAwayTemperatureHigh(di) {
        return this.getDeviceResource(this, di, 'awayTemperatureHigh');
    }

    postDevicesAwayTemperatureHigh(di, payload) {
        return this.postDeviceResource(di, 'awayTemperatureHigh', payload);
    }

    getDevicesAwayTemperatureLow(di) {
        return this.getDeviceResource(this, di, 'awayTemperatureLow');
    }

    postDevicesAwayTemperatureLow(di, payload) {
        return this.postDeviceResource(di, 'awayTemperatureLow', payload);
    }

    getDevicesEcoMode(di) {
        return this.getDeviceResource(this, di, 'ecoMode');
    }

    getDevicesHvacMode(di) {
        return this.getDeviceResource(this, di, 'hvacMode');
    }

    postDevicesHvacMode(di, payload) {
        return this.postDeviceResource(di, 'hvacMode', payload);
    }

    getDevicesHeatingFuelSource(di) {
        return this.getDeviceResource(this, di, 'heatingFuelSource');
    }

    getDevicesHasFan(di) {
        return this.getDeviceResource(this, di, 'hasFan');
    }

    getDevicesFanActive(di) {
        return this.getDeviceResource(this, di, 'fanActive');
    }

    getDevicesFanTimerActive(di) {
        return this.getDeviceResource(this, di, 'fanTimerActive');
    }

    getDevicesFanTimerTimeout(di) {
        return this.getDeviceResource(this, di, 'fanTimerTimeout');
    }

    postDevicesFanTimerTimeout(di, payload) {
        return this.postDeviceResource(di, 'fanTimerTimeout', payload);
    }

    getDevicesFanMode(di) {
        return this.getDeviceResource(this, di, 'fanMode');
    }

    postDevicesFanMode(di, payload) {
        return this.postDeviceResource(di, 'fanMode', payload);
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