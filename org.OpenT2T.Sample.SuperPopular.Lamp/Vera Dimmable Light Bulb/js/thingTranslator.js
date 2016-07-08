'use strict';

var https = require('https');
var q = require('q');

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

// Helper method to send power state commands to Vera
function sendPowerStateCommandToDevice(loadTarget, deviceId, relayServer, relaySessionToken, pkDevice) {
    var deferred = q.defer();

    // set up the url which needs:
    //   the serial number of the hub
    //   deviceid of the light bulb
    //   target brightness
    var path = '/relay/relay/relay/device/' + pkDevice + '/port_3480/data_request?id=action&output_format=json&DeviceNum=' + deviceId + '&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=' + loadTarget;

    var options = {
        protocol: 'https:',
        host: relayServer,
        path: path,
        headers: {
            'MMSSession': relaySessionToken
        },
        method: 'GET'
    };

    var req = https.request(options);

    req.on('error', (e) => {
        console.log('problem with request:' + e.message);
        deferred.reject(e);
    });

    req.on('response', (res) => {
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
        });

        res.on('end', () => {
            if (res.statusCode != 200)
            {
                console.log(res);
                deferred.reject(res);
            }
            else
            {
                deferred.resolve(res);
            }
        });

        res.on('error', (e) => {
            console.log('problem with response:' + e.message);
            deferred.reject(e);
        });
    });

    req.end();

    return deferred.promise;
}

// module exports, implementing the schema
module.exports = {

    // numeric int device id
    deviceId : null,

    // server used to connect to the vera hub
    relayServer : null,

    // session token for the relay server
    relaySessionToken : null,

    // serial number of the vera hub
    pkDevice : null,

    // data structure which represents the device targetted by this translator
    device: null,

    initDevice: function(dev) {
        var deferred = q.defer();
        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);

                if (typeof (props.relay_session_token) !== 'undefined') {
                    this.relaySessionToken = props.relay_session_token;
                } else {
                    console.log('props.relay_session_token is undefined.');
                    setImmediate(deferred.reject);
                }

                if (typeof (props.relay_server) !== 'undefined') {
                    this.relayServer = props.relay_server;
                } else {
                    console.log('props.relay_server is undefined.');
                    setImmediate(deferred.reject);
                }

                if (typeof (props.pk_device) !== 'undefined') {
                    this.pkDevice = props.pk_device;
                } else {
                    console.log('props.pk_device is undefined.');
                    setImmediate(deferred.reject);
                }

                if (typeof (props.id) !== 'undefined') {
                    this.deviceId = props.id;
                } else {
                    console.log('props.id is undefined.');
                    setImmediate(deferred.reject);
                }

                deferred.resolve();
            } else {
                console.log('props is undefined.');
                setImmediate(deferred.reject);
            }
        } else {
            console.log('device is undefined.');
            setImmediate(deferred.reject);
        }

        console.log('Javascript initialized.');
        logDeviceState(this.device);

        return deferred.promise;
    },

    turnOn: function() {
        console.log('[' + this.deviceId + '] turnOn called.');
        return sendPowerStateCommandToDevice(100, this.deviceId, this.relayServer, this.relaySessionToken, this.pkDevice);
    },

    turnOff: function() {
        console.log('[' + this.deviceId + '] turnOff called.');
        return sendPowerStateCommandToDevice(0, this.deviceId, this.relayServer, this.relaySessionToken, this.pkDevice);
    },

    // sets the dimmable bulb to the desired brightness, valid values: integer 0-100
    setBrightness: function(brightness) {
        console.log('[' + this.deviceId + '] setBrightness called with value: ' + brightness);
        return sendPowerStateCommandToDevice(brightness, this.deviceId, this.relayServer, this.relaySessionToken, this.pkDevice);
    },

    disconnect: function() {
        console.log('disconnect called.');
        var deferred = q.defer();

        logDeviceState(device);
        setImmediate(deferred.resolve);

        return deferred.promise;
    }
};

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.turnOn = module.exports.turnOn;
global.turnOff = module.exports.turnOff;
global.setBrightness = module.exports.setBrightness;
global.disconnect = module.exports.disconnect;
