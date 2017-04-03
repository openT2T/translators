'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

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

function createEntity(name, resourceType, resources) {
    return {
        n: name,
        rt: [resourceType],
        di: deviceIds[resourceType],
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
    
    var name = providerSchema['name'];
    var entities = [];

    if ('contact' in attributes) {
        var contact = createResource('oic.r.sensor.contact', 'oic.if.s', 'contact', expand, {
            value: attributes['contact'] === 'open'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.contact', [
            contact,
            getLastChangedResource(expand, attributes['contact_lastUpdated'])
        ]));
    }

    if ('lock' in attributes) {
        var locked = createResource('oic.r.sensor', 'oic.if.s', 'locked', expand, {
            value: attributes['lock'] === 'locked'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.locked', [
            locked,
            getLastChangedResource(expand, attributes['lock_lastUpdated'])
        ]));
    }

    if ('humidity' in attributes) {
        var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
            humidity: attributes['humidity']
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.humidity', [
            humidity,
            getLastChangedResource(expand, attributes['humidity_lastUpdated'])
        ]));
    }

    if ('sound' in attributes) {
        var loudnesschange = createResource('oic.r.sensor', 'oic.if.s', 'loudnesschange', expand, {
            value: attributes['sound'] === 'detected'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.loudnesschange', [
            loudnesschange,
            getLastChangedResource(expand, attributes['sound_lastUpdated'])
        ]));
    }

    if ('motion' in attributes) {
        var motion = createResource('oic.r.sensor.motion', 'oic.if.s', 'motion', expand, {
            value: attributes['motion'] === 'active'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.motion', [
            motion,
            getLastChangedResource(expand, attributes['motion_lastUpdated'])
        ]));
    }

    if ('presence' in attributes) {
        var presence = createResource('oic.r.sensor.presence', 'oic.if.s', 'presence', expand, {
            value: attributes['presence'] === 'present'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.presence', [
            presence,
            getLastChangedResource(expand, attributes['presence_lastUpdated'])
        ]));
    }

    if ('temperature' in attributes) {
        var temperature = createResource('oic.r.temperature', 'oic.if.s', 'temperature', expand, {
            temperature: attributes['temperature'],
            units: attributes['temperatureScale'].toLowerCase()
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.temperature', [
            temperature,
            getLastChangedResource(expand, attributes['temperature_lastUpdated'])
        ]));
    }

    if ('acceleration' in attributes) {
        var vibrationchange = createResource('oic.r.sensor', 'oic.if.s', 'vibrationchange', expand, {
            value: attributes['acceleration'] === 'active'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.vibrationchange', [
            vibrationchange,
            getLastChangedResource(expand, attributes['acceleration_lastUpdated'])
        ]));
    }

    if ('water' in attributes) {
        var water = createResource('oic.r.sensor.water', 'oic.if.s', 'water', expand, {
            value: attributes['liquid_detected'] === 'wet'
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.water', [
            water,
            getLastChangedResource(expand, attributes['water_lastUpdated'])
        ]));
    }


    if ('battery' in attributes) {
        var battery = createResource('oic.r.energy.battery', 'oic.if.s', 'battery', expand, {
            charge: attributes['battery']
        });

        entities.push(createEntity(name, 'opent2t.d.battery', [
            battery
        ]));
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.multisensor.superpopular',
            translator: 'opent2t-translator-com-smartthings-sensorpod',
            controlId: providerSchema['id'],
            endpointUri: providerSchema['endpointUri']
        },
        pi: providerSchema['id'],
        mnmn: defaultValueIfEmpty(providerSchema['manufacturer'], "SmartThings"),
        mnmo: defaultValueIfEmpty(providerSchema['model'], "Sensor (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.multisensor.superpopular'],
        entities: entities
    };
}

// Each device in the platform has is own unique static identifier
const deviceIds = {
    'opent2t.d.sensor.acceleration': 'F86B44C9-C2B3-4BE4-AAAA-CABEF061DB3F',
    'opent2t.d.sensor.airquality': '2F64C336-79DB-42DC-9567-E139C8484C78',
    'opent2t.d.sensor.atmosphericpressure': '393C4D30-9413-4621-9B35-FEA3A2306B6C',
    'opent2t.d.sensor.brightnesschange': '8CC43FB7-1442-4FA0-9020-8A56F4D5BEEE',
    'opent2t.d.sensor.carbondioxide': '69ECE9A9-A0F3-4FAD-AB23-A77BF0EAE23D',
    'opent2t.d.sensor.carbonmonoxide': '58EA654B-4269-4CB7-9BE2-D04F9B8E7931',
    'opent2t.d.sensor.contact': '67D227BD-376A-4DA8-BAB5-90E95B977EE0',
    'opent2t.d.sensor.combustiblegas': 'C27A2C67-01FF-4D8A-ADA0-ED2686D21247',
    'opent2t.d.sensor.glassbreak': '6D455474-93B1-4F02-84FD-E5D090C2E6DB',
    'opent2t.d.sensor.humidity': 'B8F8AAF3-6688-44D0-8EE7-7FD525672475',
    'opent2t.d.sensor.illuminance': '2678A774-A65C-4701-B8CE-2B6B5CADDEE8',
    'opent2t.d.sensor.locked': 'B9B3E572-0FB7-4F9D-A8B1-BF90DB120FBB',
    'opent2t.d.sensor.loudnesschange': 'BC47CB27-C234-46D7-B03F-8CDC1D52F5B3',
    'opent2t.d.sensor.motion': '63E5A41E-7283-4BA6-A3A8-21AE3C18C17F',
    'opent2t.d.sensor.presence': 'F0FDF054-C8FF-44CD-AE1D-BD129AB4FF99',
    'opent2t.d.sensor.temperature': 'E7FA6B8B-4B8B-4172-840A-00414BA5055E',
    'opent2t.d.sensor.uvradiation': '8E15BE1A-68CF-46BF-B625-7C1CBD4AF968',
    'opent2t.d.sensor.vibrationchange': 'D38E580A-C4E2-45C5-A316-5A685553B868',
    'opent2t.d.sensor.smoke': '0CAA68B9-A7D3-46E1-8C99-3606F1BA41AE',
    'opent2t.d.sensor.touch': 'CD5AB9DA-EB5C-4483-9610-6C20961246BC',
    'opent2t.d.sensor.water': '6726E344-8471-4A99-90D4-403EFD961936',
    'opent2t.d.battery': '06C47089-1049-46CF-BB64-74F7E7C4F501'
}

// This translator class implements the 'org.opent2t.sample.multisensor.superpopular' interface.
class Translator {

    constructor(logger, deviceInfo) {
        this.logger = logger;
        this.logger.info('Initializing device.');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.endpointUri = deviceInfo.deviceInfo.opent2t.endpointUri;
        this.smartthingsHub = deviceInfo.hub;

        this.logger.info('SmartThings Sensorpod Translator initialized.');
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