'use strict';

var sleep = require('sleep');
var async = require('async');

// helper library for interacting with this lamp
var LEDBlue = require('./ledblue-helper').LEDBlue;

var argv = require('optimist')
    .usage('Usage: $0 -b [bulb Id]')
    .demand(['b'])
    .argv;
    
var pairKey = 0x01;

// Goes through a sequence of test operations for the LEDBlue helper
LEDBlue.getBulb(argv.b, function(bulb) {
    async.series([
        function(callback) {
            console.log('connect');
            bulb.connect(callback);
        },
        function(callback) {
            console.log('pair');
            bulb.pair(pairKey, callback);
        },
        function(callback) {
            console.log('on');
            bulb.turnOn(callback)
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('red');
            bulb.setColor(255, 0, 0, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('green');
            bulb.setColor(0, 255, 0, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('blue');
            bulb.setColor(0, 0, 255, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('white');
            bulb.setColor(255, 255, 255, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('half');
            bulb.setColor(128, 128, 128, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('min');
            bulb.setColor(1, 1, 1, callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            console.log('off');
            bulb.turnOff(callback);
        },
        function(callback) {
            sleep.sleep(1);
            callback(null);
        },
        function(callback) {
            bulb.disconnect(callback);
            callback(null);
        },
    ],
        function() {
            process.exit(0);
        });
});
