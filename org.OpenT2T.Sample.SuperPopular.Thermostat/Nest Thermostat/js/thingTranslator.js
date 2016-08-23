'use strict';
var Firebase = require('firebase');
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

    initDevice : function(dev) {
        var myThis = this;
        this.device = dev;
        console.log('Initializing device.');

        myThis.firebaseRef = new Firebase("https://developer-api.nest.com");
        myThis.data = null;
        myThis.fahrenheit = false;

        validateArgumentType(myThis.device, 'device', 'object');
        validateArgumentType(myThis.device.props, 'device.props', 'string');

        var props = JSON.parse(myThis.device.props);
        validateArgumentType(props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
       
        myThis.nestThermostat = myThis.firebaseRef.child("devices/thermostats/" + props.id);

        logDeviceState(this.device);

        var deferred = q.defer();   // Take a deferral
        // Authenticate users with a custom authentication token
        myThis.nestThermostat.authWithCustomToken(props.access_token, (error, authData) => {
            if (error) {
                console.log("Login Failed!", error);
                deferred.reject(error);
            } else {
                console.log("Successfully authenticated with developer-api.nest.com: " + JSON.stringify(authData));
                myThis.update().then((data) => {
                    deferred.resolve(data);
                }, error => {
                    deferred.reject(error);
                });
                console.log('Initialized.');
            }
        });
        return deferred.promise; // return the promise
    },

    disconnect : function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    },
    
    // update the local cache of device properties
    update : function(){
        var myThis = this;
        var deferred = q.defer();   // Take a deferral
        myThis.nestThermostat.once('value', result =>  {
            var data = result.val();
            myThis.data = data; // this is a map of property values
            console.log("thermostat settings=" + data);
            deferred.resolve(data);
        }, error =>  {
            console.log("Reading thermostat value failed: " + error.message);
            deferred.reject(error);
        });
        return deferred.promise; // return the promise
    },
    
    useFahrenheit : function(flag) {        
        this.fahrenheit = flag;
    },
    
    getProperties : function(){
        return this.data;
    },

    setProperty : function(name, value) {
        var myThis = this;
        var deferred = q.defer();   // Take a deferral  
        var propertyRef = myThis.nestThermostat.child(name);
        if (typeof(value) == "number")
        {
            // for some reason Nest only takes integer values.
            value = Math.round(value);
        }

        propertyRef.set(value, function (error) {
            if (error) {
                console.log("Setting " + name + " failed: " + error);
                deferred.reject(error);
            } else {
                console.log("Set " + name + "=" + value + " succeeded");
                deferred.resolve(name);
            }
        });
        return deferred.promise; // return the promise
    },

    getProperty : function(name){
        var myThis = this;
        if (myThis.data == null) {
            throw new Error("Please call update() before reading properties.");
        }
        return myThis.data[name];
    },

    isTurnedOn : function() {
        return this.getMode() != 'off';
    },

    // This function sets the hvac_mode to 'heat-cool' so nest will heat or cool
    // automatically depending on the settings and the current temperature and
    // your "green" settings that determine how much it energy it can use...
    turnOnAuto : function() {
        return this.setMode('heat-cool');
    },

    turnOff : function() {
        return this.setMode('off');
    },

    getMode : function() {
        return this.getProperty('hvac_mode');
    },

    setMode : function(value) {
        if (this.getProperty['hvac_mode'] != value)
        {
            return this.setProperty('hvac_mode', value);
        }
        return emptyPromise();
    },

    getAmbientTemperature : function() {   
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.getProperty('ambient_temperature' + suffix);
    },
    
    getHeatingSetpoint : function() {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.getProperty('target_temperature_high' + suffix);
    },

    setHeatingSetpoint : function(value) {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.setProperty('target_temperature_high' + suffix, value);
    },

    getCoolingSetpoint : function() {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.getProperty('target_temperature_low' + suffix);
    },

    setCoolingSetpoint : function(value) {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.setProperty('target_temperature_low' + suffix, value);
    },

    getTargetTemperature : function(value) {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.getProperty('target_temperature' + suffix);
    },

    setTargetTemperature : function(value) {
        var suffix = (this.fahrenheit ? "_f" : "_c");
        return this.setProperty('target_temperature' + suffix, value);
    },

    getAvailableModes : function(value) {
        var deferred = q.defer();   // Take a deferral
        deferred.resolve(['heat', 'cool', 'heat-cool','off']);
        return deferred.promise; // return the promise
    }
}