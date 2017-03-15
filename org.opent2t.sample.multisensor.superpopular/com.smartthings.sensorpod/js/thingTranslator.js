'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TLogger = require('opent2t').Logger;

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

function convertDeviceDateToTranslatorDate(unixTimestamp) {
    // Date takes a number of milliseconds, so convert seconds to milliseconds
    var datetime = new Date(unixTimestamp * 1000);

    return datetime.toISOString();
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
    'opent2t.d.sensor.acceleration': 'A547EDCF-DB00-4FE3-81A8-867879718471',
    'opent2t.d.sensor.airquality': 'CD55D8C0-A485-484D-842C-7F3D692FCAA4',
    'opent2t.d.sensor.atmosphericpressure': '2A6517F8-261D-4FB1-8B0C-BEC531443175',
    'opent2t.d.sensor.brightnesschange': 'F18D060B-B672-497C-A66B-44D690EC6825',
    'opent2t.d.sensor.carbondioxide': 'B533FF0D-0B2D-499D-83E0-57DA256DD720',
    'opent2t.d.sensor.carbonmonoxide': '153F3969-139C-4D48-AA85-2977DCFF7957',
    'opent2t.d.sensor.contact': 'A125DBD1-1AA7-4F87-BB5A-7149272F3225',
    'opent2t.d.sensor.combustiblegas': '3C36C983-3508-4B9A-9C97-4933A8C2D531',
    'opent2t.d.sensor.glassbreak': '1699836C-EBB2-4F59-BFB0-EA9163B0C2CD',
    'opent2t.d.sensor.humidity': '61033A42-B81A-4C94-B6F3-23C2B3766B13',
    'opent2t.d.sensor.illuminance': 'EB3FCB5F-65DC-4228-9125-B97222522E11',
    'opent2t.d.sensor.locked': '563434A2-801F-4A95-8411-4043054C76ED',
    'opent2t.d.sensor.loudnesschange': '4389B317-9CF4-4DAD-BC18-C061090B88BA',
    'opent2t.d.sensor.motion': 'DC0EE2A1-B8B2-45FC-A14E-56F8544DBCE8',
    'opent2t.d.sensor.presence': 'A9FD1BD1-7CCB-4C8F-9270-4F30AEC33886',
    'opent2t.d.sensor.temperature': '08A956B2-9ED0-413D-9741-75D71A3F168C',
    'opent2t.d.sensor.uvradiation': '7CF338CB-A0EF-43C9-A2D7-6DFAF8196069',
    'opent2t.d.sensor.vibrationchange': 'EFB10535-44D4-44A7-AB54-AE1B4BC02AB0',
    'opent2t.d.sensor.smoke': 'E978737B-1AFD-4B44-BA6D-193D87C5FD1A',
    'opent2t.d.sensor.touch': '3A04BBFD-8CDF-48B5-9511-42425BB2DBE1',
    'opent2t.d.sensor.water': '00FC03C5-81D7-48A1-A2E8-3919A9A3D33F',
    'opent2t.d.battery': 'CD873FF4-79BB-47BD-865A-2D1357601E6A'
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