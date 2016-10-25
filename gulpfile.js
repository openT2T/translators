"use strict";

var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');
var eslint = require('gulp-eslint');
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

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
  return gulp.src(['**/js/package.json', '!**/node_modules/**', '!**/Helpers/**'])
    .pipe(namingValidator())
});

gulp.task('xml-lint', function () {
  return gulp.src(['**/*.xml', '!**/node_modules/**'])
    .pipe(xmlValidator())
});

gulp.task('js-lint', () => { 
    return gulp.src(['**/*.js','!**/node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('json-lint', () => { 
    return gulp.src(['**/*.json','!**/node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('raml-lint', () => { 
    return gulp.src(['**/*.raml','!**/node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('ci-checks', ['js-lint', 'json-lint', 'xml-lint', 'validate-naming']);
