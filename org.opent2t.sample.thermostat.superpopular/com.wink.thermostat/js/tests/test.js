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

console.log("Device Under Test -  Name: " + config.Device.name + "  Props: " + JSON.stringify(config.Device.props));

///
/// Run a series of tests to validate the translator
///

// Get AmbientTemperature
ava.test.serial("AmbientTemperature", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.ThingAccessor.createTranslatorAsync(require("path").join(__dirname, ".."), "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    let ambientTemperature = yield opent2t.ThingAccessor.getPropertyAsync(device, "org.opent2t.sample.thermostat.superpopular", "ambientTemperature");
    console.log("*** ambientTemperature: " + ambientTemperature);
    t.truthy(ambientTemperature);
}));

// Set/Get TargetTemperatureHigh
ava.test.serial("TargetTemperatureHigh", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.ThingAccessor.createTranslatorAsync(require("path").join(__dirname, ".."), "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    yield opent2t.ThingAccessor.setPropertyAsync(device, "org.opent2t.sample.thermostat.superpopular", "targetTemperatureHigh", 22.8);
    let targetTemperatureHigh = yield opent2t.ThingAccessor.getPropertyAsync(device, "org.opent2t.sample.thermostat.superpopular", "targetTemperatureHigh");
    t.is(targetTemperatureHigh, 22.8);
}));

// Set/Get TargetTemperatureLow
ava.test.serial("TargetTemperatureLow", (t) => __awaiter(this, void 0, void 0, function* () {
    let device = yield opent2t.ThingAccessor.createTranslatorAsync(require("path").join(__dirname, ".."), "thingTranslator", config.Device);
    t.is(typeof device, "object") && t.truthy(device);
    yield opent2t.ThingAccessor.setPropertyAsync(device, "org.opent2t.sample.thermostat.superpopular", "targetTemperatureLow", 18.5);
    let targetTemperatureLow = yield opent2t.ThingAccessor.getPropertyAsync(device, "org.opent2t.sample.thermostat.superpopular", "targetTemperatureLow");
    t.is(targetTemperatureLow, 18.5);
}));
