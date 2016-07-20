'use strict';

var https = require('https');
var q = require('q');

var switchPowerService = 'urn:upnp-org:serviceId:SwitchPower1';
var switchAction = 'SetTarget';
var switchVariable = 'newTargetValue';

var dimmingService = 'urn:upnp-org:serviceId:Dimming1';

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
function sendPowerStateCommandToDevice(veraService, veraAction, veraVariable, 
                                       loadTarget, deviceId, 
                                       relayServer, relaySessionToken, 
                                       pkDevice) {
    var deferred = q.defer();

    // set up the url which needs:
    //   the serial number of the hub (pkDevice)
    //   deviceid of the light bulb
    //   service that is being targetted 
    var path = '/relay/relay/relay/device/' + pkDevice + '/port_3480/data_request?id=action&output_format=json';
    path = path + '&DeviceNum=' + deviceId;
    path = path + '&serviceId=' + veraService;
    path = path + '&action=' + veraAction;
    path = path + '&' + veraVariable + '=' + loadTarget;

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
                deferred.reject(new Error("Invalid HTTP response: " + res.statusCode + " - " + res.statusMessage));
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

// simple argument validation for the exported methods below
function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
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
        this.device = dev;

        validateArgumentType(this.device, 'device', 'object');
        validateArgumentType(this.device.props, 'device.props', 'string');

        var props = JSON.parse(this.device.props);
        validateArgumentType(props.relay_session_token, 'device.props.relay_session_token', 'string');
        validateArgumentType(props.relay_server, 'device.props.relay_server', 'string');
        validateArgumentType(props.pk_device, 'device.props.pk_device', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
        this.relaySessionToken = props.relay_session_token;
        this.relayServer = props.relay_server;
        this.pkDevice = props.pk_device;
        this.deviceId = props.id;

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    turnOn: function() {
        console.log('[' + this.deviceId + '] turnOn called.');
        return sendPowerStateCommandToDevice(switchPowerService, switchAction, switchVariable, 
                                             1, this.deviceId, 
                                             this.relayServer, this.relaySessionToken, 
                                             this.pkDevice);
    },

    turnOff: function() {
        console.log('[' + this.deviceId + '] turnOff called.');
        return sendPowerStateCommandToDevice(switchPowerService, switchAction, switchVariable, 
                                             0, this.deviceId, 
                                             this.relayServer, this.relaySessionToken, 
                                             this.pkDevice);
    },

    // sets the dimmable bulb to the desired brightness, valid values: integer 0-100
    setBrightness: function(brightness) {
        console.log('[' + this.deviceId + '] setBrightness called with value: ' + brightness);
        var action = 'SetLoadLevelTarget';
        var variable = 'newLoadlevelTarget';
        return sendPowerStateCommandToDevice(dimmingService, action, variable, 
                                             brightness, this.deviceId, 
                                             this.relayServer, this.relaySessionToken, 
                                             this.pkDevice);
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
};