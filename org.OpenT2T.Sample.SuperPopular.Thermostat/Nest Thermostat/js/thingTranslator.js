'use strict';

var https = require('follow-redirects').https;
var httpsNoRedirect = require('https');

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

var deviceId, accessToken;

// module exports, implementing the schema
module.exports = {

    device: null,

    initDevice: function(dev) {
        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);

                if (typeof (props.access_token) !== 'undefined') {
                    accessToken = props.access_token;
                } else {
                    console.log('props.access_token is undefined.');
                }

                if (typeof (props.id) !== 'undefined') {
                    deviceId = props.id;
                } else {
                    console.log('props.id is undefined.');
                }
            } else {
                console.log('props is undefined.');
            }
        } else {
            console.log('device is undefined.');
        }

        console.log('javascript initialized.');
        logDeviceState(this.device);
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    },
    
    getTemperatureProperty: function(name, scale, callback) {
        var options = {
            protocol: 'https:',
            host: 'developer-api.nest.com',
            path: '/devices/thermostats/' + deviceId,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            method: 'GET'
        };

        var httpsRequest = https.get(options, function(getRes) {
            var body = '';
            getRes.setEncoding('utf8');
            getRes.on('data', function(data) {
                body += data;
            });

            getRes.on('end', function() {
                if (getRes.statusCode != 200) {
                    if (callback) {
                        callback("Error Code:" + getRes.statusCode);
                        return;
                    }
                } else {
                    var data = JSON.parse(body);
                    callback(data[name]);
                    }
            });

            getRes.on('error', function(e) {
                callback('error');
            });
        });

        httpsRequest.end();
    },

    setTemperatureProperty: function(name, scale, value, callback) {

        var postData;
        if (scale == "c"){
            postData = { name : value };
        }
        else {
            postData = { name : value };
        }
        postData = JSON.stringify(postData);

        var options = {
            protocol: 'https:',
            host: 'developer-api.nest.com',
            path: '/devices/thermostats/' + deviceId,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-length': Buffer.byteLength(postData),
            },
            method: 'PUT',
        };

        var httpsRequest = https.request(options, (getRes) => {
            console.log("Request sent");
            var body = '';
            getRes.setEncoding('utf8');
            getRes.on('data', (data) => {
                body += data;
            });

            getRes.on('end', () => {
                if (getRes.statusCode != 200) {
                    if (callback) {
                        callback("Error Code:" + getRes.statusCode);
                        return;
                    }
                } else {
                    var data = JSON.parse(body);
                    if ((scale == "c") && !!data.target_temperature_c) {
                        callback(data.target_temperature_c);
                    }
                    else if ((scale == "f") && !!data.target_temperature_f) {
                        callback(data.target_temperature_f);
                    }
                }
            });

            getRes.on('error', (e) => {
                callback('error');
            });
        });
        httpsRequest.write(postData);
        httpsRequest.end();
    },

    getAmbientTemperature: function(scale, callback) {
        console.log('getAmbientTemperature called.');
        getTemperatureProperty('ambient_temperature_'+scale, scale, callback);
    },

    getTargetTemperature: function(scale, callback) {
        console.log('getTargetTemperature called.');
        getTemperatureProperty('target_temperature_'+scale, scale, callback);
    },

    setTargetTemperature: function(scale, value, callback) {
        console.log('setTargetTemperature called.');
        if (scale == "c"){
            setTemperatureProperty('target_temperature_c', scale, value, callback);
        }
        else {
            setTemperatureProperty('target_temperature_f', scale, value, callback);
        }
    }
}

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.getTemperatureProperty = module.exports.getTemperatureProperty;
global.setTemperatureProperty = module.exports.setTemperatureProperty;
global.getAmbientTemperature = module.exports.getAmbientTemperature;
global.setTargetTemperature = module.exports.setTargetTemperature;
global.disconnect = module.exports.disconnect;
