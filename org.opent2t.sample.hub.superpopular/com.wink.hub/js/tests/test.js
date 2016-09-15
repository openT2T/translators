// var schema = require("c:/githome/translators/org.opent2t.sample.thermostat.superpopular/org.opent2t.sample.thermostat.superpopular");
// console.log(schema);

var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var PubNub = require('pubnub')
var q = require('q')

console.log("Config:");
console.log(JSON.stringify(config, null, 2));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// HubResURI
test.serial('HubResURI', t => {
    var deferred = q.defer();
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {

            translator.on('change', function(message) {
                console.log('test got it');
            });

            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.hub.superpopular', 'HubResURI')
                .then((hub) => {

                    console.log("Hub:");
                    console.log(JSON.stringify(hub, null, 2));

                    // TEST: something was returned
                    t.truthy(hub);

                    // TEST: hub has devices
                    t.truthy(hub.devices);
                    t.true(hub.devices.length > 0);

                    return deferred.promise;
                });
        });
});

test.serial('pubnub', t => {
    var deferred = q.defer();

    // Uses my pubhub demp project to ensure I am receiving messages correctly.
    // var pubnubDemo = new PubNub({
    //     publishKey: 'pub-c-42a15c90-854a-49b3-aae5-8703d15432dd',
    //     subscribeKey: 'sub-c-10c46d14-793e-11e6-9717-0619f8945a4f'
    // });

    // pubnubDemo.addListener({
    //     status: function(statusEvent) {
    //         if (statusEvent.category === "PNConnectedCategory") {
    //             console.log("connected");
    //             // var publishConfig = {
    //             //     channel : 'demo',
    //             //     message : 'Verification for demo publish/subscribe'
    //             // };
    //             // console.log('Publishing demo message');
    //             // pubnubDemo.publish(publishConfig, function(status, response) {
    //             //     console.log('response:', response);
    //             // });
    //         }
    //     },
    //     message: function(message) {
    //         console.log("Message on channel " + message.channel);
    //     },
    //     presense: function(presenceEvent) {
    //         //nothing right now
    //     }
    // });

    // pubnubDemo.subscribe({
    //     channels: ['demo']
    // });
    

    var pubnub = new PubNub({
        subscribeKey: 'sub-c-f7bf7f7e-0542-11e3-a5e8-02ee2ddab7fe'
    });

    pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === "PNConnectedCategory") {
                console.log('connected actual');
            }
        },
        message: function(message) {
            console.log("Message: ");
            console.log(JSON.stringify(message, null, 2));
        },
        presence: function(presenceEvent) {
            // handle presence
        }
    });

    // Add listeners to various devices on the wink acct.
    // I do not expect that these can change, not sure why there is a "user" chunk at the end.
    // possibly tied to the auth?
    pubnub.subscribe({
        channels: [
            //'5ab718c85e9e19d6c39f10dce53af3f58e75c695', // User themselves, for device discovery
            //'1ff1b7f8628eba1794f06040e92cb3d0e9fb499f|hub-486668|user-523303',
            '14b8d78c249059486c2d1ca24aafd7398c7a18c7|light_bulb-1985159|user-523303'
            //'073005fe9bb92e2defc0195dac76751e74876b29|thermostat-152846|user-523303
        ]});

        pubnub.subscribe({
            channels: ['073005fe9bb92e2defc0195dac76751e74876b29|thermostat-152846|user-523303']
        });

console.log("Waiting on messages from channels...");
    // This promise is never resolved, so we just wait and print out messages until ctrl+c'

    return deferred.promise;
});
