var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var translatorPath = require('path').join(__dirname, '..');

var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");  
logger.verbose("Config:");
logger.verbose(JSON.stringify(config, null, 2));
var opent2t = new OpenT2T(logger);

///
/// Run a series of tests to validate the translator
///

// GetPlatforms
test.serial('GetPlatforms', t => {

    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'getPlatforms', [true])
                .then((hub) => {

                    logger.verbose("Hub:");
                    logger.verbose(JSON.stringify(hub, null, 2));

                    // TEST: something was returned
                    t.truthy(hub);

                    // TEST: hub has platforms
                    t.truthy(hub.platforms);
                    t.true(hub.platforms.length > 0);
                });
        });
});

