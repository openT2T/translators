'use strict';

var OpenT2T = require('opent2t').OpenT2T;
const SchemaName = 'org.opent2t.sample.lamp.superpopular';
var translator = undefined;

function runLampTests(settings) {
    var test = settings.test;
    var deviceId = settings.deviceId;

    function setData(t) {
        if(settings.setTestData) {
            settings.setTestData(t.title, t);
        }
    }

    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
			OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                if(deviceId === undefined) {
                    deviceId = response.opent2t.controlId;
                }
			});
        });
    });

    test.serial('Valid Lamp Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    test.serial('GetPlatform', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
            t.is(response.rt[0], SchemaName);
            
            var resource = response.entities[0].resources[0];
            t.is(resource.rt[0], 'oic.r.switch.binary');
            t.true(resource.value == undefined);
            t.true(resource.id == undefined);
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', [true])
            .then((response) => {
                t.is(response.rt[0], SchemaName);

                var resource = response.entities[0].resources[0];
                t.is(resource.id, 'power');
                t.is(resource.rt[0], 'oic.r.switch.binary');
                t.true(resource.value !== undefined);
        });
    });

    test.serial('GetPower', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesPower', [deviceId])
            .then((response) => {
                t.is(response.rt[0], 'oic.r.switch.binary');
        });
    });

    test.serial('SetPower', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': true }])
            .then((response) => {
                t.is(response.rt[0], 'oic.r.switch.binary');
                t.is(response.id, 'power');
                t.true(response.value === true);

                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': false }])
                    .then((responseTwo) => {
                        t.is(responseTwo.id, 'power');
                        t.true(responseTwo.value === false);
                });
        });
    });

    test.serial('GetDimming', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDeviceResource', [deviceId, 'dim'])
            .then((response) => {
                t.is(response.rt[0], 'oic.r.light.dimming');
                t.true(response.dimmingSetting !== undefined);
        });
    });

    test.serial('SetDimming', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 10 }])
            .then((response) => {
                t.is(response.rt[0], 'oic.r.light.dimming');
                t.is(response.id, 'dim');
                t.true(response.dimmingSetting === 10);

                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 50 }])
                    .then((responseTwo) => {
                        t.is(responseTwo.id, 'dim');
                        t.true(responseTwo.dimmingSetting === 50);
                });
        });
    });
}

module.exports = runLampTests;