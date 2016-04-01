'use strict';

// helper library for interacting with this lamp
var Statistics = require('./lib/test-thermostat-helper').Statistics;
var Point = require('./lib/test-thermostat-helper').Point;

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log("  device.name          : " + device.name);
        console.log("  device.props         : " + device.props);
    } else {
        console.log('device is undefined');
    }
};

// generate a random sample 
function randomTemperatureTrend() {
    var len = Math.floor(Math.random() * 30);
    if (len == 0) return 0;
    var pts = new Array(len);
    var trend = len % 2 ? 1 : -1; // generate a pseudo positive or negative trend
    for (var i = 0; i < len; i++) {
        pts[i] = new Point(i, Math.floor(60 + trend * (len % 5) * Math.random() * 5));
    }
    var line = Statistics.linearRegression(pts);
    return line[1];
}

// module exports, implementing the schema
module.exports = {

    device: null,

    initDevice: function(dev) {
        this.device = dev;

        console.log("Javascript initialized.");
        logDeviceState(this.device);
    },

    getCurrentTemperature: function() {

        console.log("getCurrentTemperature called.");
        var temperature = Math.floor(32 + Math.random() * 78); //random int value in [32, 110] range
        console.log("returning random temperature: " + temperature);
        return temperature;
    },

    getTemperatureTrend: function() {

        console.log("getTemperatureTrend called.");
        var trend = randomTemperatureTrend();
        console.log("returning random temperature trend: " + trend);
        return trend;
    },

    disconnect: function() {
        console.log("disconnect called.");
        logDeviceState(this.device);
    }
}

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.getCurrentTemperature = module.exports.getCurrentTemperature;
global.getTemperatureTrend = module.exports.getTemperatureTrend;
global.disconnect = module.exports.disconnect;