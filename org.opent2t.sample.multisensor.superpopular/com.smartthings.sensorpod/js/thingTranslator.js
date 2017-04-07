'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TLogger = require('opent2t').Logger;
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

/**
 * Validates an argument matches the expected type.
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
 * Returns a default value if the specified property is null, undefined, or an empty string
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || property === null || property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

function createEntity(name, resourceType, resources, controlId) {
    return {
        n: name,
        rt: [resourceType],
        di: generateGUID(controlId + resourceType),
        icv: 'core.1.1.0',
        dmv: 'res.1.1.0',
        resources: resources
    }
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

function getLastChangedResource(expand, timeStamp) {
    return createResource('opent2t.r.timestamp', 'oic.if.s', 'lastchanged', expand, {
        timestamp: timeStamp
    });
}

/**
 * Converts a representation of a platform from the SmartThings API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {
    var attributes = providerSchema.attributes;
    
    var controlId= providerSchema['id'];
    var name = providerSchema['name'];
    var entities = [];

    if ('contact' in attributes) {
        var contact = createResource('oic.r.sensor.contact', 'oic.if.s', 'contact', expand, {
            value: attributes['contact'] === 'open'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.contact', [
            contact,
            getLastChangedResource(expand, attributes['contact_lastUpdated'])
        ],
        controlId));
    }

    if ('lock' in attributes) {
        var locked = createResource('oic.r.sensor', 'oic.if.s', 'locked', expand, {
            value: attributes['lock'] === 'locked'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.locked', [
            locked,
            getLastChangedResource(expand, attributes['lock_lastUpdated'])
        ],
        controlId));
    }

    if ('humidity' in attributes) {
        var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
            humidity: attributes['humidity']
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.humidity', [
            humidity,
            getLastChangedResource(expand, attributes['humidity_lastUpdated'])
        ],
        controlId));
    }

    if ('sound' in attributes) {
        var loudnesschange = createResource('oic.r.sensor', 'oic.if.s', 'loudnesschange', expand, {
            value: attributes['sound'] === 'detected'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.loudnesschange', [
            loudnesschange,
            getLastChangedResource(expand, attributes['sound_lastUpdated'])
        ],
        controlId));
    }

    if ('motion' in attributes) {
        var motion = createResource('oic.r.sensor.motion', 'oic.if.s', 'motion', expand, {
            value: attributes['motion'] === 'active'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.motion', [
            motion,
            getLastChangedResource(expand, attributes['motion_lastUpdated'])
        ],
        controlId));
    }

    if ('presence' in attributes) {
        var presence = createResource('oic.r.sensor.presence', 'oic.if.s', 'presence', expand, {
            value: attributes['presence'] === 'present'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.presence', [
            presence,
            getLastChangedResource(expand, attributes['presence_lastUpdated'])
        ],
        controlId));
    }

    if ('temperature' in attributes) {
        var temperature = createResource('oic.r.temperature', 'oic.if.s', 'temperature', expand, {
            temperature: attributes['temperature'],
            units: attributes['temperatureScale'].toLowerCase()
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.temperature', [
            temperature,
            getLastChangedResource(expand, attributes['temperature_lastUpdated'])
        ],
        controlId));
    }

    if ('acceleration' in attributes) {
        var vibrationchange = createResource('oic.r.sensor', 'oic.if.s', 'vibrationchange', expand, {
            value: attributes['acceleration'] === 'active'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.vibrationchange', [
            vibrationchange,
            getLastChangedResource(expand, attributes['acceleration_lastUpdated'])
        ],
        controlId));
    }

    if ('water' in attributes) {
        var water = createResource('oic.r.sensor.water', 'oic.if.s', 'water', expand, {
            value: attributes['liquid_detected'] === 'wet'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.water', [
            water,
            getLastChangedResource(expand, attributes['water_lastUpdated'])
        ],
        controlId));
    }


    if ('battery' in attributes) {
        var battery = createResource('oic.r.energy.battery', 'oic.if.s', 'battery', expand, {
            charge: attributes['battery']
        });

        entities.push(createEntity(name, 'opent2t.d.battery', [
            battery
        ],
        controlId));
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.multisensor.superpopular',
            translator: 'opent2t-translator-com-smartthings-sensorpod',
            controlId: providerSchema['id'],
            endpointUri: providerSchema['endpointUri']
        },
        availability: providerSchema['status'] === 'ONLINE' || providerSchema['status'] === 'ACTIVE' ? 'online' : 'offline',
        pi: providerSchema['id'],
        mnmn: defaultValueIfEmpty(providerSchema['manufacturer'], "SmartThings"),
        mnmo: defaultValueIfEmpty(providerSchema['model'], "Sensor (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.multisensor.superpopular'],
        entities: entities
    };
}

// This translator class implements the 'org.opent2t.sample.multisensor.superpopular' interface.
class Translator {

    constructor(deviceInfo, logLevel = "info") {
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
        this.ConsoleLogger.info('Initializing device.');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.endpointUri = deviceInfo.deviceInfo.opent2t.endpointUri;
        this.smartthingsHub = deviceInfo.hub;

        this.ConsoleLogger.info('SmartThings Sensorpod Translator initialized.');
    }

    /**
     * Queries the entire state of the multisensor
     * and returns an object that maps to the json schema org.opent2t.sample.multisensor.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return this.smartthingsHub.getDeviceDetailsAsync(this.endpointUri, this.controlId)
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

    getDevicesAccelerationX(deviceId) {
        return this.getDeviceResource(deviceId, "accelerationX");
    }

    getDevicesAccelerationY(deviceId) {
        return this.getDeviceResource(deviceId, "accelerationY");
    }

    getDevicesAccelerationZ(deviceId) {
        return this.getDeviceResource(deviceId, "accelerationZ");
    }

    getDevicesAirquality(deviceId) {
        return this.getDeviceResource(deviceId, "airquality");
    }

    getDevicesAtmosphericpressure(deviceId) {
        return this.getDeviceResource(deviceId, "atmosphericpressure");
    }

    getDevicesBrightnesschange(deviceId) {
        return this.getDeviceResource(deviceId, "brightnesschange");
    }

    getDevicesCarbondioxide(deviceId) {
        return this.getDeviceResource(deviceId, "carbondioxide");
    }

    getDevicesCarbonmonoxide(deviceId) {
        return this.getDeviceResource(deviceId, "carbonmonoxide");
    }

    getDevicesContact(deviceId) {
        return this.getDeviceResource(deviceId, "contact");
    }

    getDevicesCombustiblegas(deviceId) {
        return this.getDeviceResource(deviceId, "combustiblegas");
    }

    getDevicesGlassbreak(deviceId) {
        return this.getDeviceResource(deviceId, "glassbreak");
    }

    getDevicesHumidity(deviceId) {
        return this.getDeviceResource(deviceId, "humidity");
    }

    getDevicesIlluminance(deviceId) {
        return this.getDeviceResource(deviceId, "illuminance");
    }

    getDevicesLocked(deviceId) {
        return this.getDeviceResource(deviceId, "locked");
    }

    getDevicesLoudnesschange(deviceId) {
        return this.getDeviceResource(deviceId, "loudnesschange");
    }

    getDevicesMotion(deviceId) {
        return this.getDeviceResource(deviceId, "motion");
    }

    getDevicesPresence(deviceId) {
        return this.getDeviceResource(deviceId, "presence");
    }

    getDevicesSmoke(deviceId) {
        return this.getDeviceResource(deviceId, "smoke");
    }

    getDevicesTemperature(deviceId) {
        return this.getDeviceResource(deviceId, "temperature");
    }

    getDevicesTouch(deviceId) {
        return this.getDeviceResource(deviceId, "touch");
    }

    getDevicesUvradiation(deviceId) {
        return this.getDeviceResource(deviceId, "uvradiation");
    }

    getDevicesVibrationchange(deviceId) {
        return this.getDeviceResource(deviceId, "vibrationchange");
    }

    getDevicesWater(deviceId) {
        return this.getDeviceResource(deviceId, "water");
    }

    getDevicesBattery(deviceId) {
        return this.getDeviceResource(deviceId, "battery");
    }

    getDevicesLastchanged(deviceId) {
        return this.getDeviceResource(deviceId, "lastchanged");
    }

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartthingsHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartthingsHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;