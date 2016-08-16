'use strict';

var sleep = require('sleep');
var async = require('async');

// helper library for interacting with this lamp
var PolarH7 = require('./polarh7-helper').PolarH7;

var argv = require('optimist')
    .usage('Usage: $0 -s [sensor Id]')
    .demand(['s'])
    .argv;

// Goes through a sequence of test operations for the PolarH7 helper
PolarH7.getSensor(argv.s, function(sensor) {
    async.series(
        [
            function(asyncLibCallback) {
                sensor.disconnect(asyncLibCallback);
                asyncLibCallback(null);
            },
            function(asyncLibCallback) {
                sleep.sleep(1);
                asyncLibCallback(null);
            },
            function(asyncLibCallback) {
                console.log('connect');
                sensor.connect(asyncLibCallback);
            },
            function(asyncLibCallback) {
                sleep.sleep(1);
                asyncLibCallback(null);
            },
            function(asyncLibCallback) {
                sensor.getBeatsPerMinute((bpm) => {
                    console.log(bpm + " bpm");
                    asyncLibCallback(null);
                });
            },
            function(asyncLibCallback) {
                sleep.sleep(1);
                asyncLibCallback(null);
            },
            function(asyncLibCallback) {
                sensor.disconnect(asyncLibCallback);
                asyncLibCallback(null);
            },
        ],
        function() {
            process.exit(0);
        });
});
