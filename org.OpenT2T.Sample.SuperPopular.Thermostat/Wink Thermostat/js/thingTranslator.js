'use strict';

var https = require('https');
var wh = require("org.OpenT2T.Sample.SuperPopular.Helpers/js/index.js"); //change this to your local

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
        //use the winkHub device and initialize
        wh.initWinkApi("thermostats",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized.');
        logDeviceState(this.device);
    },

    turnOn: function() {
        console.log('turnOn called.');
        wh.sendDesiredStateCommand("powered",true, function (error, result) 
        {
            console.log(result); 
        }); 
    },

    turnOff: function() {
        console.log('turnOff called.');
        wh.sendDesiredStateCommand("powered",false, function (error, result) 
        {
            console.log(result); 
        }); 
    },

    getCurrentTemperature: function() {
        wh.getLastReading('temperature',function (error, result) 
        {
             console.log(result); 
             return result;
        });
    },
    
    getCoolingSetpoint: function()
    {
        wh.getValueOfDesiredState('max_set_point',function (error, result) 
        {
             console.log(result); 
             return result;
        });
    },
    
    getHeatingSetpoint:function()
    {
         wh.getValueOfDesiredState('min_set_point',function (error, result) 
        {
             console.log(result); 
             return result;
        });
    },
    
    getMode:function()
    {
         wh.getValueOfDesiredState('mode',function (error, result) 
        {
             console.log(result); 
             return result;
        });
    },
    
    
    setMode:function(value)
    {
       console.log("Trying to set Mode")
       wh.sendDesiredStateCommand("mode",value, function (error, result) 
        {
            console.log(result); 
        });  
    },
    
    setHeatingSetpoint:function(temp)
    {
        wh.sendDesiredStateCommand("min_set_point",temp, function (error, result) 
        {
            console.log(result); 
        });  
    },
    
    setCoolingSetpoint:function(temp)
    {
        wh.sendDesiredStateCommand("max_set_point",temp, function (error, result) 
        {
            console.log(result); 
        });  
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
    
};

// globals for JxCore host
global.getCoolingSetpoint = module.exports.getCoolingSetpoint;
global.getHeatingSetpoint= module.exports.getHeatingSetpoint;
global.turnOff = module.exports.turnOff;
global.turnOn = module.exports.turnOn;
global.disconnect = module.exports.disconnect;
global.setCoolingSetpoint = module.exports.setCoolingSetpoint;
global.setHeatingSetpoint = module.exports.setHeatingSetpoint;
global.getCurrentTemperature = module.exports.getCurrentTemperature;
global.getMode = module.exports.getMode;
