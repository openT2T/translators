"use strict";

const PLUGIN_NAME = 'Manifest Validator';
var utils = require('./utilities');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var path = require('path');
var fs = require('fs');

// Manifest Validator verifies the following:
// 1.) All tokens defined in the onboarding/askUserPermission flow (except state)
//      are defined in onboarding/getDeveloperInput
// 2.) If a manifest has onboarding defined, verify the onboarding id
//      matches a dependency in the package.json file.
function verify(file, log) {
    var doc = new dom().parseFromString(file.contents.toString());
    var onboardingNode = xpath.select("//manifest/onboarding", doc, true);

    if(onboardingNode !== undefined) {
        validateUrlTokens(onboardingNode, log, file.path);
        validateNaming(onboardingNode, log, file.path);
    }
}

// verify all tokens defined in the onboarding/askUserPermission flow (except state)
// are defined in onboarding/getDeveloperInput
function validateUrlTokens(onboardingNode, log, filepath) {
    var urlTokens = [];
    var permissionFlowNode = xpath.select("onboardflow[@name='askUserPermission']/flow[arg[@name='url']]", onboardingNode, true);

    if(permissionFlowNode !== undefined) {
        var urlTemplate = xpath.select("description/text()", permissionFlowNode, true);

        if(urlTemplate !== undefined) {
            var regex = /{(?!state)(.*?)}/g;
            var match;

            do {
                match = regex.exec(urlTemplate);
                if (match && urlTokens.indexOf(match[1]) === -1 ) {
                    urlTokens.push(match[1]);
                }
            } while (match);
        }
    }

    urlTokens.forEach((value) => {
        var valueNode = xpath.select("onboardflow[@name='getDeveloperInput' or @name='getUserInput']/flow[arg[@name='" + value + "']]", onboardingNode, true);
        
        if(valueNode === undefined) {
            log.error(filepath, 'Undefined Url token: ' + value);
        }
    });
}

// If a manifest has onboarding defined, verify the onboarding id
// matches a dependency in the package.json file.
function validateNaming(onboardingNode, log, filepath) {
    const NAME_PREFIX = 'opent2t-onboarding-';
    var id = xpath.select1("@id", onboardingNode);
    var expectedDependencyName = NAME_PREFIX + id.value.replace(/\./g, '-');
    var packagePath = path.join(path.dirname(filepath), 'package.json');
    var metadata = JSON.parse(fs.readFileSync(packagePath).toString());

    if(!metadata.dependencies.hasOwnProperty(expectedDependencyName)) {
        log.error(filepath, 'package.json is missing onboarding dependency: ' + expectedDependencyName);
    }
}

module.exports = utils.createTaskFunction(PLUGIN_NAME, verify);
