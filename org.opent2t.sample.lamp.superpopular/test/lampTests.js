'use strict';

var OpenT2T = require('opent2t').OpenT2T;

function runLampTests(createTranslator, deviceId, test, setTestData) {

    function setData(name, t) {
        if(setTestData) {
            setTestData(name, t);
        }
    }

    test.serial('Valid Lamp Translator', t => {
        return createTranslator().then(translator => {
            t.is(typeof translator, 'object') && t.truthy(translator);
        });
    });

    test.serial('GetPlatform', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'get', []).then((response) => {
                t.is(response.rt[0], 'org.opent2t.sample.lamp.superpopular');
                
                var resource = response.entities[0].resources[0];
                t.is(resource.rt[0], 'oic.r.switch.binary');
                t.true(resource.value == undefined);
                t.true(resource.id == undefined);
            });
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'get', [true])
                .then((response) => {
                    t.is(response.rt[0], 'org.opent2t.sample.lamp.superpopular');

                    var resource = response.entities[0].resources[0];
                    t.is(resource.id, 'power');
                    t.is(resource.rt[0], 'oic.r.switch.binary');
                    t.true(resource.value !== undefined);
            });
        });
    });

    test.serial('GetPower', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'getDevicesPower', [deviceId])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
            });
        });
    });

    test.serial('SetPower', t => {
        setData('SetPower', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postDevicesPower', [deviceId, { 'value': true }])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
                    t.is(response.id, 'power');
                    t.true(response.value === true);

                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postDevicesPower', [deviceId, { 'value': false }])
                        .then((responseTwo) => {
                            t.is(responseTwo.id, 'power');
                            t.true(responseTwo.value === false);
                    });
            });
        });
    });

    test.serial('GetDimming', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'getDeviceResource', [deviceId, 'dim'])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.light.dimming');
                    t.true(response.dimmingSetting !== undefined);
            });
        });
    });

    test.serial('SetDimming', t => {
        setData('SetDimming', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 10 }])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.light.dimming');
                    t.is(response.id, 'dim');
                    t.true(response.dimmingSetting === 10);

                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 50 }])
                        .then((responseTwo) => {
                            t.is(responseTwo.id, 'dim');
                            t.true(responseTwo.dimmingSetting === 50);
                    });
            });
        });
    });

}

module.exports = runLampTests;