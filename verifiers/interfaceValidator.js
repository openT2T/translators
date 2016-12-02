"use strict";

const PLUGIN_NAME = 'Interface Validator';
var utils = require('./utilities');
var path = require('path');
var glob = require("glob");
var raml = require('raml-1-parser');
var acorn = require('acorn/dist/acorn_loose');
acorn.walk = require('acorn/dist/walk');

// Interface Validator ensures that thing translator classes have implementations
// for all methods defined in the raml for the device type.
function verify(file, log) {
  var ramlPath = getRamlFilePath(file.path);
  var schemaMethods = getSchemaMethods(ramlPath);
  var translatorMethods = getTranslatorMethods(file);

  schemaMethods.forEach(method => {
    if(translatorMethods.indexOf(method) === -1) {
      log.error(file.path, 'Schema method not found: ' + method);
    }
  });
}

// Get the raml file that corresponds to the thing translator.
// This assumes that the nearest ancestor raml file is the correct
// corresponding file.
function getRamlFilePath(filePath) {
  var prevDir = null;
  var currentDir = path.dirname(filePath);

  while(prevDir !== currentDir) {
    var ramlFiles = glob.sync(currentDir + '/*.raml');

    if(ramlFiles.length > 0) {
      return ramlFiles[0];
    }

    prevDir = currentDir;
    currentDir = path.join(currentDir, '..');
  }

  return null;
}

// Get all of the methods defined in a raml schema file.
function getSchemaMethods(ramlPath) {

  function addMethod(methodName) {
    if(ramlMethods.indexOf(methodName) === -1) {
      ramlMethods.push(methodName);
    }
  }

  var ramlMethods = [];

  if(ramlPath) {
    var resources = [];
    raml.loadApiSync(ramlPath).resources().forEach(r => {
      resources.push(r);
    });

    while(resources.length > 0) {
      var current = resources.shift();
      var resourceParts = current.completeRelativeUri().substring(1).split("/");
      var suffix = "";

      resourceParts.forEach(part => {
        if(!part.startsWith("{") && !part.startsWith("?")){
          suffix += part.charAt(0).toUpperCase() + part.slice(1);
        }
      });

      current.is().forEach(trait => {
        var traitName = trait.name();
        if(traitName === "interface-sensor") {
          addMethod("get" + suffix);
        }
        else if(traitName === "interface-actuator") {
          addMethod("get" + suffix);
          addMethod("post" + suffix);
        }
      });

      current.methods().forEach(method => {
        addMethod(method.method() + suffix);
      });

      current.resources().forEach(child => {
        resources.push(child);
      });
    }
  }

  return ramlMethods;
}

// Get all of the class methods in a translator class.
// It is assumed that translator classes will always be named 'Translator'
function getTranslatorMethods(file) {
  var translatorMethods = [];
  var ast = acorn.parse_dammit(file.contents.toString());
  var translatorClass = acorn.walk.findNodeAt(ast, null, null, (nodeType, node) => {
    return (nodeType === "ClassDeclaration" && node.id.name === "Translator");
  });

  if(translatorClass) {
    var children = translatorClass.node.body.body;

    children.forEach(child => {
      if(child.type === "MethodDefinition") {
        translatorMethods.push(child.key.name);
      }
    });
  }

  return translatorMethods;
}

module.exports = utils.createTaskFunction(PLUGIN_NAME, verify);
