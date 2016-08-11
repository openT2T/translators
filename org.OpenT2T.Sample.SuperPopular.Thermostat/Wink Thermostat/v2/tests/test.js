/*jshint esversion: 6 */
var opent2t = require('opent2t');
var ava = require('ava');
var config = require('./testconfig');
var delay = require('delay')

// This boilerplate code is copied from transpiled typescript AVA test code, which enables usage of 'yield' keyword. 
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};

function logAndValidate(p, name, expected) {
    return p.then(result => {
        if((expected !== undefined) && (result != expected))
        {
            throw name+"- Expected: "+ expected + ", Actual: "+ result;
        }
        else
        {
            console.log(name+ " (As expcted) : " + result);
        }
        return result;
    }).catch(error => {
        console.log("Test Error: " + error.message);
        throw error;
    });
};

console.log("Device Under Test -  Name: " + config.Device.name + "  Props: " + config.Device.props);

///
/// Run a series of tests to validate the translator
///

// Set/Get Mode. Get Available modes
ava.test.serial("Mode", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.DeviceAccessor.createTranslatorAsync("../..", "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    yield opent2t.DeviceAccessor.setPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "Mode", "heat_only");
    let mode = yield opent2t.DeviceAccessor.getPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "Mode");
    t.is(mode, "heat_only");

    let currentTemp = yield opent2t.DeviceAccessor.getPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "CurrentTemperature");

    let availbleModes = yield opent2t.DeviceAccessor.getPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "AvailableModes");
    t.is(availbleModes.toString(), "cool_only,heat_only,auto,aux");
}));

// Set/Get HeatingSetpoint
ava.test.serial("HeatingSetpoint", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.DeviceAccessor.createTranslatorAsync("../..", "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    yield opent2t.DeviceAccessor.setPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "HeatingSetpoint", 22);
    let heatingSetpoint = yield opent2t.DeviceAccessor.getPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "HeatingSetpoint");
    t.is(heatingSetpoint, 22);
}));

// Set/Get CoolingSetpoint
ava.test.serial("CoolingSetpoint", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.DeviceAccessor.createTranslatorAsync("../..", "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    yield opent2t.DeviceAccessor.setPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "CoolingSetpoint", 12);
    let coolingSetpoint = yield opent2t.DeviceAccessor.getPropertyAsync(device, "org.OpenT2T.Sample.SuperPopular.Thermostat", "CoolingSetpoint");
    t.is(coolingSetpoint, 12);
}));


