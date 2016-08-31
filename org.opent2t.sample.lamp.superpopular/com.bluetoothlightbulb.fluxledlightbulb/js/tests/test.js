const sleep = require('es6-sleep').promise;
const test = require('ava');
const OpenT2T = require('opent2t').OpenT2T;
const config = require('./testConfig');
const fluxHelper = require('../flux');
const translatorPath = require('path').join(__dirname, '..');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));

///
/// Run through a series of tests for the helper class directly
///
test.serial('Helper_Direct', t => {
    // discover a bulb with given ID in config
    var id = config.Device.props.id
    console.log('Starting discovery for: ' + id);
    return fluxHelper.discover(id).then(bulb => {
        console.log('Discovery returned, now connecting');
        return bulb.connect().then(() => {
            console.log('Connect returned, now pairing');
            return bulb.pair(0x01).then(() => {
                console.log('Pairing returned, now turning on');
                return bulb.setPowerState(true).then(() => {
                    console.log('Turned on, now waiting a bit to keep the bulb on for 1 sec');
                    return sleep(1000).then(() => {
                        console.log('Wait complete, now turning the color to red');
                        return bulb.setColor(255, 0, 0).then(() => {
                            console.log('Bulb is red, now waiting a bit to keep the bulb red for 1 second');
                            return sleep(1000).then(() => {
                                console.log('Wait complete, now turning the color to green');
                                return bulb.setColor(0, 255, 0).then(() => {
                                    console.log('Bulb is green, now waiting a bit to keep the bulb green for 1 second');
                                    return sleep(1000).then(() => {
                                        console.log('Wait complete, now turning the color to white');
                                        return bulb.setColor(255, 255, 255).then(() => {
                                            console.log('Bulb is white, now waiting a bit to keep the bulb white for 1 second');
                                            return sleep(1000).then(() => {
                                                console.log('Wait complete, now turning the bulb off');
                                                return bulb.setPowerState(false).then(() => {
                                                    console.log('Turned off, now waiting a bit to disconnect');
                                                    return sleep(1000).then(() => {
                                                        console.log('Wait complete, now disconnecting');
                                                        return bulb.disconnect().then(() => {
                                                            console.log('Disconnected... all done!');

                                                            // space out the next test to let the lamp recover.
                                                            return sleep(2000);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
