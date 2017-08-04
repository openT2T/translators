'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var crypto = require('crypto');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

/**
 * Generate a GUID for given an ID.
 *
 * TODO: This method should be moved to a shared location for all translators
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Wink' + stringID).digest('hex');
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
        throw new OpenT2TError(404, `Entity: ${di} for resourceId:  ${resourceId} not found.`);
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new OpenT2TError(404, `Resource with resourceID: ${resourceId} not found.`);
    }
    
    return resource;
}

/**
 * Wink does not always populate every desired_state property, but last_reading doesn't necessarily
 * update as soon as we send our PUT request. Instead of relying just on one state or the other,
 * we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
 * if it is not.
 */
class StateReader {
    constructor(desired_state, last_reading) {
        this.desired_state = desired_state;
        this.last_reading = last_reading;
    }

    get(state) {
        if (this.desired_state[state] !== undefined) {
            return this.desired_state[state];
        }
        else {
            return this.last_reading[state];
        }
    }

    containsKey(state) {
        return (state in this.desired_state ||
                state in this.last_reading); 
    }
}

function convertDeviceDateToTranslatorDate(unixTimestamp) {
    // Only convert if input is valid numeric value
    if (unixTimestamp && !isNaN(unixTimestamp)) { 
        // Date takes a number of milliseconds, so convert seconds to milliseconds
        var datetime = new Date(unixTimestamp * 1000);
        return datetime.toISOString();
    }

    // for all other invalid input return undefined
    return undefined;
}

function convertDeviceBatteryToTranslatorBattery(batteryValue) {
    return Math.round(batteryValue * 100);
}

/**
 * Returns a default value if the specified property is null, undefined, or an empty string only
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || 
        property === null || 
        property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

function createEntity(name, resourceType, resources, platformId) {
    return {
        n: name,
        rt: [resourceType],
        di: generateGUID(platformId + resourceType),
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

/**
 * Retrieves the _changed_at value for the given property as date value if available.
 * If not, it will try to retrieve the the _updated_at value.
 * If that is also not available it will return undefined.
 * @param {*} stateReader 
 * @param {*} property 
 * @param {*} expand 
 * @param {*} logger 
 */
function getLastChangedResource(stateReader, property, expand, logger) {
    
    let lastChangedTime = convertDeviceDateToTranslatorDate(stateReader.get(property + '_changed_at'));

    if (!lastChangedTime) {
        logger.warn(`Failed to retrieve '_changed_at time' for property ${property}`);
        logger.warn(`Attempting to retrieve '_updated_at' for property ${property} instead`);
        lastChangedTime = convertDeviceDateToTranslatorDate(stateReader.get(property + '_updated_at'));
    
        if (!lastChangedTime) {
            logger.warn(`Failed to retrieve neither '_updated_at_' nor '_changed_at_' for ${property}`);
        }
    }
    
    logger.info(`Returning value '${lastChangedTime}' for lastChangedResource- ${property}`);
    return createResource('opent2t.r.timestamp', 'oic.if.s', 'lastchanged', expand, {
        timestamp: lastChangedTime
    });
}

/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand, logger) {
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);

    var name = providerSchema['name'];
    var entities = [];

    if (stateReader.containsKey('brightness')) {
        var brightnesschange = createResource('oic.r.sensor', 'oic.if.s', 'brightnesschange', expand, {
            value: stateReader.get('brightness')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.brightnesschange', [
            brightnesschange,
            getLastChangedResource(stateReader, 'brightness', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('opened')) {
        var contact = createResource('oic.r.sensor.contact', 'oic.if.s', 'contact', expand, {
            value: stateReader.get('opened')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.contact', [
            contact,
            getLastChangedResource(stateReader, 'opened', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('humidity')) {
        var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
            humidity: Math.round(100 * stateReader.get('humidity'))
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.humidity', [
            humidity,
            getLastChangedResource(stateReader, 'humidity', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('locked')) {
        var locked = createResource('oic.r.sensor', 'oic.if.s', 'locked', expand, {
            value: stateReader.get('locked')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.locked', [
            locked,
            getLastChangedResource(stateReader, 'locked', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('loudness')) {
        var loudnesschange = createResource('oic.r.sensor', 'oic.if.s', 'loudnesschange', expand, {
            value: stateReader.get('loudness')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.loudnesschange', [
            loudnesschange,
            getLastChangedResource(stateReader, 'loudness', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('motion')) {
        var motion = createResource('oic.r.sensor.motion', 'oic.if.s', 'motion', expand, {
            value: stateReader.get('motion')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.motion', [
            motion,
            getLastChangedResource(stateReader, 'motion', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('occupied')) {
        var presence = createResource('oic.r.sensor.presence', 'oic.if.s', 'presence', expand, {
            value: stateReader.get('occupied')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.presence', [
            presence,
            getLastChangedResource(stateReader, 'occupied', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('temperature')) {
        var temperature = createResource('oic.r.temperature', 'oic.if.s', 'temperature', expand, {
            temperature: stateReader.get('temperature'),
            units: "C"
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.temperature', [
            temperature,
            getLastChangedResource(stateReader, 'temperature', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('vibration')) {
        var vibrationchange = createResource('oic.r.sensor', 'oic.if.s', 'vibrationchange', expand, {
            value: stateReader.get('vibration')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.vibrationchange', [
            vibrationchange,
            getLastChangedResource(stateReader, 'vibration', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('liquid_detected')) {
        var water = createResource('oic.r.sensor.water', 'oic.if.s', 'water', expand, {
            value: stateReader.get('liquid_detected')
        });

        entities.push(createEntity(name, 'opent2t.d.sensor.water', [
            water,
            getLastChangedResource(stateReader, 'liquid_detected', expand, logger)
        ],
        providerSchema['uuid']));
    }

    if (stateReader.containsKey('battery')) {
        var battery = createResource('oic.r.energy.battery', 'oic.if.s', 'battery', expand, {
            charge: convertDeviceBatteryToTranslatorBattery(stateReader.get('battery'))
        });

        entities.push(createEntity(name, 'opent2t.d.battery', [
            battery
        ],
        providerSchema['uuid']));
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.multisensor.superpopular',
            translator: 'opent2t-translator-com-wink-sensorpod',
            controlId: providerSchema['object_id'],
            uuid: providerSchema['uuid']
        },
        pi: providerSchema['uuid'],
        mnmn: defaultValueIfEmpty(providerSchema['device_manufacturer'], "Wink"),
        mnmo: defaultValueIfEmpty(providerSchema['manufacturer_device_model'], "Sensor (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.multisensor.superpopular'],
        entities: entities
    };
}

// This translator class implements the 'org.opent2t.sample.multisensor.superpopular' interface.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-wink-sensorpod";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.uuid = deviceInfo.deviceInfo.opent2t.uuid;
        this.winkHub = deviceInfo.hub;
        this.deviceType = 'sensor_pods';

        this.logger.info('Wink Sensorpod Translator initialized.');
    }

    /**
     * Queries the entire state of the multisensor
     * and returns an object that maps to the json schema org.opent2t.sample.multisensor.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand, this.logger);
        } else {
            return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response.data, expand, this.logger);
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
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;