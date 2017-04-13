'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var helpers = require('opent2t-testcase-helpers');
var translator = undefined;

var uuidRegExMatch = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

function runTranslatorTests(settings) {
    var opent2t = new OpenT2T(settings.logger);
    var test = settings.test;
    var deviceId = settings.deviceId;
    var SchemaName = settings.schemaName;
    
    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
            return opent2t.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                if(deviceId === undefined) {
                    deviceId = response.entities[0].di;
                }
            });
        });
    });

    test.serial('Valid Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    /**
     * Verify that the ouput from GetPlatform includes all of the required properties
     */
    test.serial('GetPlatform', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                // Verify required platform properties are present.
                // This is helpful for new translators that do not have a snapshot yet.
                t.truthy(response.availability, `Platform requires platform availability (availability)`);
                t.truthy(response.pi, `Platform requires an id (pi)`);
                t.truthy(response.pi.match(uuidRegExMatch), `Platform id must be a UUID (pi)`);
                t.truthy(response.mnmn, `Platform requires a manufacturer name (mnmn)`);
                t.truthy(response.mnmo, `Platform requires a model name (mnmo)`);
                t.truthy(response.n, `Platform requires a friendly name (n)`);

                // Verify that the platform includes the correct opent2t schema
                t.not(response.rt.indexOf(SchemaName), -1, `Platform must include '${SchemaName}' in resources (rt)`);
                
                // Verify each entity has the required properties
                for(var i = 0; i < response.entities.length; i++) {
                    let entity = response.entities[i];
                    t.truthy(entity.icv, `Entity ${i} requires a core version (icv)`);
                    t.truthy(entity.dmv, `Entity ${i} requires a device model version (dmv)`);
                    t.truthy(entity.n, `Entity ${i} requires a friendly name (n)`);
                    t.truthy(entity.di, `Entity ${i} requires an id (di)`);
                    t.truthy(entity.di.match(uuidRegExMatch), `Entity ${i} id must be a UUID (di)`);

                    for(var j = 0; j < entity.resources.length; j++) {
                        let resource = entity.resources[j];
                        t.truthy(resource.href, `Resource ${i},${j} requires an href (href)`);
                        
                        t.truthy(resource.rt, `Resource ${i},${j} requires an array of schemas (rt)`);
                        t.true(Array.isArray(resource.rt), `Resource ${i},${j} requires an array of schemas (rt)`);
                        t.true(resource.rt.length > 0, `Resource ${i},${j} requires an array of schemas (rt)`);

                        t.truthy(resource.if, `Resource ${i},${j} requires an array of interfaces (if)`);
                        t.true(Array.isArray(resource.if), `Resource ${i},${j} requires an array of interfaces (if)`);
                        t.true(resource.if.length > 0, `Resource ${i},${j} requires an array of interfaces (if)`);

                        // Check for oic.if.a XOR oic.if.s
                        t.true(
                            (resource.if.indexOf('oic.if.a') > -1) !=  (resource.if.indexOf('oic.if.s') > -1),
                            `Resource ${i},${j} requires an interface be either an actuator or a sensor (if)`
                        );

                        // And it needs oic.r.baseline too
                        t.true(resource.if.indexOf('oic.if.baseline') > -1, `Resource ${i},${j} requires an interface to include 'oic.r.baseline' (if)`);
                    }
                }

                t.snapshot(response);
            });
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'get', [true])
                .then((response) => {
                    // GetPlatform covers the required properties, so just verify a snapshot here.
                    t.snapshot(response);
            });
        });
    });

    test.skip.serial('GetSubscribe', t => {
        t.fail("Not Implemented");
    });

    test.skip.serial('PostSubscribe', t => {
        t.fail("Not Implemented");
    });

    test.skip.serial('DeleteSubscribe', t => {
        t.fail("Not Implemented");
    });
}

module.exports = runTranslatorTests;