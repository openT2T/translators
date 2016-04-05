'use strict';

var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;


// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log("  device.name          : " + device.name);
        console.log("  device.props         : " + device.props);
    } else {
        console.log('device is undefined');
    }
};


// gets a light index, given a unique id for a light
function getLightIndexFromId(uniqueid, callback) {
    api.lights(function(err, result) {
        if (err)
            console.log(err);
        else {
            for (var light of result.lights) {
                if (light.uniqueid == uniqueid) {
                    callback(light.id);
                    return;
                }
            }
        }
        console.log("light not found for " + uniqueid);
        callback(0);
        return;
    });
}

var displayResult = function(result) {
    console.log(result);
    console.log(JSON.stringify(result, null, 2));
};


var device;
var deviceProps;
var api;

// module exports, implementing the schema
module.exports = {

    initDevice: function(dev) {
        device = dev;

        if (typeof (dev) == "undefined") {
            console.log("device is invalid");
        } else {
            device = dev;

            console.log("Javascript initialized.");
            if (typeof (device.props) !== "undefined") {
                deviceProps = JSON.parse(device.props);

                if (typeof (deviceProps.ipAddress) !== "undefined" &&
                    typeof (deviceProps.userId) !== "undefined" &&
                    typeof (deviceProps.uniqueId) !== "undefined") {
                    api = new HueApi(deviceProps.ipAddress, deviceProps.userId);
                } else {
                    console.log("props.ipAddress, props.userId or props.uniqueId is missing");
                }
            } else {
                console.log("props is missing");
            }
        }
    },

    turnOn: function() {
        console.log("turnOn called.");
        getLightIndexFromId(deviceProps.uniqueId, function(index) {
            var state = lightState.create().on();
            api.setLightState(index, state)
                .done();
        });
    },

    turnOff: function() {
        console.log("turnOff called.");
        getLightIndexFromId(deviceProps.uniqueId, function(index) {
            var state = lightState.create().off();
            api.setLightState(index, state)
                .done();
        });
    },

    setBrightness: function(brightness) {
        console.log("setBrightness called.");
        getLightIndexFromId(deviceProps.uniqueId, function(index) {
            var state = lightState.create().brightness(brightness);
            api.setLightState(index, state)
                .done();
        });
    },

    disconnect: function() {
        console.log("disconnect called.");
        logDeviceState(device);
    }
};

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.turnOn = module.exports.turnOn;
global.turnOff = module.exports.turnOff;
global.setBrightness = module.exports.setBrightness;
global.disconnect = module.exports.disconnect;