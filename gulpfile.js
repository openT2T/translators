"use strict";

var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');
var eslint = require('gulp-eslint');
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
const NO_MODULES = '!**/node_modules/**';

// The namingValidator validates that the name of the translator is consistent
// between the translator folder and the package.json file.  It also validates
// that the name of the translator is correctly prepended in the package.json file.
var namingValidator = function() {
  const PLUGIN_NAME = 'Naming Validator';
  const NAME_PREFIX = 'opent2t-translator-';
  var errorOutputList = [];

  function transformFunction (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    var metadata = JSON.parse(file.contents.toString());
    var folderName = path.basename(path.dirname(path.dirname(file.path)));
    var expectedName = NAME_PREFIX + folderName.replace(/\./g, '-');

    if(metadata.name !== expectedName) {
        errorOutputList.push(file.path + '\n' + gutil.colors.red("Error: ") + 'Incorrect translator name. Expected: ' + expectedName);
    }

    return callback(null, file);
  }

  function errorOutput(callback) {
    if (errorOutputList.length > 0) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME, '\n' + errorOutputList.join('\n\n') + '\n', {
            showStack: false
        }));
     }
     callback();
  }

  return through.obj(transformFunction, errorOutput);
}

gulp.task('validate-naming', function () {
  return gulp.src(['**/js/package.json', NO_MODULES, '!**/Helpers/**'])
    .pipe(namingValidator())
});

gulp.task('xml-lint', function () {
  return gulp.src(['**/*.xml', NO_MODULES])
    .pipe(xmlValidator())
});

gulp.task('js-lint', () => { 
    return gulp.src(['**/*.js', NO_MODULES])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('json-lint', () => { 
    return gulp.src(['**/*.json', NO_MODULES])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('raml-lint', () => { 
    return gulp.src(['**/*.raml', NO_MODULES])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('ci-checks', ['js-lint', 'json-lint', 'xml-lint', 'validate-naming']);
