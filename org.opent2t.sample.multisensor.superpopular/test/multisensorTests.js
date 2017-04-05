'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var helpers = require('opent2t-testcase-helpers');
var translator = undefined;
const SchemaName = 'org.opent2t.sample.multisensor.superpopular';
var testSettings = undefined;

function runMultisensorTests(settings) {
    var test = settings.test;
    testSettings = settings;
    var deviceIds = {};
    
    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                for (var i = 0; i < response.entities.length; i++) {
                    deviceIds[response.entities[i].rt[0]] = response.entities[i].di;
                }
			});
        });
    });

    test.serial('Valid Multisensor Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    test.serial('GetPlatform', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
            t.is(response.rt[0], SchemaName);

            t.true(response.entities.length > 0);
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', [true])
            .then((response) => {
                t.is(response.rt[0], SchemaName);

            t.true(response.entities.length > 0);
        });
    });

    test.serial('GetAccelerationX', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAccelerationX', [deviceIds['opent2t.d.sensor.acceleration']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.acceleration');
                    t.true(response.acceleration !== undefined);
                    t.true(response.id === 'accelerationX');
                });
            });
    });

    test.serial('GetAccelerationY', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAccelerationY', [deviceIds['opent2t.d.sensor.acceleration']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.acceleration');
                    t.true(response.acceleration !== undefined);
                    t.true(response.id === 'accelerationY');
                });
            });
    });

    test.serial('GetAccelerationZ', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAccelerationZ', [deviceIds['opent2t.d.sensor.acceleration']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.acceleration');
                    t.true(response.acceleration !== undefined);
                    t.true(response.id === 'accelerationZ');
                });
            });
    });

    test.serial('GetAirquality', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAirquality', [deviceIds['opent2t.d.sensor.airquality']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.airquality');
                    t.true(response.contaminantvalue !== undefined);
                    t.true(response.contaminanttype !== undefined);
                    t.true(response.valuetype !== undefined);
                    t.true(response.id === 'airquality');
                });
            });
    });

    test.serial('GetAtmosphericpressure', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAtmosphericpressure', [deviceIds['opent2t.d.sensor.atmosphericpressure']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.atmosphericpressure');
                    t.true(response.atmosphericPressure !== undefined);
                    t.true(response.id === 'atmosphericpressure');
                });
            });
    });

    test.serial('GetBrightnesschange', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesBrightnesschange', [deviceIds['opent2t.d.sensor.brightnesschange']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'brightnesschange');
                });
            });
    });

    test.serial('GetCarbondioxide', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesCarbondioxide', [deviceIds['opent2t.d.sensor.carbondioxide']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.carbondioxide');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'carbondioxide');
                });
            });
    });

    test.serial('GetCarbonmonoxide', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesCarbonmonoxide', [deviceIds['opent2t.d.sensor.carbonmonoxide']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.carbonmonoxide');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'carbonmonoxide');
                });
            });
    });

    test.serial('GetContact', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesContact', [deviceIds['opent2t.d.sensor.contact']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.contact');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'contact');
                });
            });
    });

    test.serial('GetCombustiblegas', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesCombustiblegas', [deviceIds['opent2t.d.sensor.combustiblegas']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'combustiblegas');
                });
            });
    });

    test.serial('GetGlassbreak', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesGlassbreak', [deviceIds['opent2t.d.sensor.glassbreak']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.glassbreak');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'glassbreak');
                });
            });
    });

    test.serial('GetHumidity', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHumidity', [deviceIds['opent2t.d.sensor.humidity']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.humidity');
                    t.true(response.humidity !== undefined);
                    t.true(response.id === 'humidity');
                });
            });
    });

    test.serial('GetIlluminance', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesIlluminance', [deviceIds['opent2t.d.sensor.illuminance']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.illuminance');
                    t.true(response.illuminance !== undefined);
                    t.true(response.id === 'illuminance');
                });
            });
    });

    test.serial('GetLocked', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesLocked', [deviceIds['opent2t.d.sensor.locked']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'locked');
                });
            });
    });

    test.serial('GetLoudnesschange', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesLoudnesschange', [deviceIds['opent2t.d.sensor.loudnesschange']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'loudnesschange');
                });
            });
    });

    test.serial('GetMotion', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesMotion', [deviceIds['opent2t.d.sensor.motion']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.motion');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'motion');
                });
            });
    });

    test.serial('GetMotion_FromWrongDevice', t => {
        t.throws(helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesMotion', [deviceIds['opent2t.d.battery']])
                .then(() => {
                    t.fail('getDevicesMotion for a non-motion device should fail');
                });
            }));
    });

    test.serial('GetLastChanged_FromMotion', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesLastchanged', [deviceIds['opent2t.d.sensor.motion']])
                .then((response) => {
                    t.is(response.rt[0], 'opent2t.r.timestamp');
                    if(testSettings.inputLastReading !== undefined) { //Wink-Only
                        let testChangedAt = testSettings.inputLastReading["motion_changed_at"];
                        let testUpdatedAt = testSettings.inputLastReading["motion_updated_at"];
                        if ((!testChangedAt || isNaN(testChangedAt))
                            && (!testUpdatedAt || isNaN(testUpdatedAt))) { 
                            t.true(response.timestamp === undefined, "Expected undefined value for motion-lastchanged");
                        } else {
                            t.true(response.timestamp !== undefined, "Expected a valid datetime value for motion-lastchanged");
                        }
                    } else {    //Other Providers
                        t.true(response.timestamp !== undefined, "Expected a valid datetime value for motion-lastchanged");
                    }

                    t.true(response.id === 'lastchanged');
                });
            });
    });

    test.serial('GetPresence', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesPresence', [deviceIds['opent2t.d.sensor.presence']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.presence');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'presence');
                });
            });
    });

    test.serial('GetTemperature', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTemperature', [deviceIds['opent2t.d.sensor.temperature']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.temperature');
                    t.true(response.temperature !== undefined);
                    t.true(response.units !== undefined);
                    t.true(response.id === 'temperature');
                });
            });
    });

    test.serial('GetUvradiation', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesUvradiation', [deviceIds['opent2t.d.sensor.uvradiation']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.radiation.uv');
                    t.true(response.measurement !== undefined);
                    t.true(response.id === 'uvradiation');
                });
            });
    });

    test.serial('GetVibrationchange', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesVibrationchange', [deviceIds['opent2t.d.sensor.vibrationchange']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'vibrationchange');
                });
            });
    });

    test.serial('GetSmoke', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesSmoke', [deviceIds['opent2t.d.sensor.smoke']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.smoke');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'smoke');
                });
            });
    });

    test.serial('GetTouch', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTouch', [deviceIds['opent2t.d.sensor.touch']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.touch');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'touch');
                });
            });
    });

    test.serial('GetWater', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesWater', [deviceIds['opent2t.d.sensor.water']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.water');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'water');
                });
            });
    });

    test.serial('GetBattery', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesBattery', [deviceIds['opent2t.d.battery']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.energy.battery');
                    t.true(response.charge !== undefined);
                    t.true(response.id === 'battery');
                });
            });
    });
}

module.exports = runMultisensorTests;