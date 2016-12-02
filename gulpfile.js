"use strict";

const NO_MODULES = '!**/node_modules/**';
var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');
var eslint = require('gulp-eslint');
var InterfaceValidator = require('./verifiers/interfaceValidator');
var NamingfaceValidator = require('./verifiers/namingValidator');
var ManifestValidator = require('./verifiers/manifestValidator');

gulp.task('validate-interfaces', function () {
  return gulp.src(['**/js/thingTranslator.js', NO_MODULES])
    .pipe(InterfaceValidator())
});

gulp.task('validate-naming', function () {
  return gulp.src(['**/js/package.json', NO_MODULES, '!**/Helpers/**'])
    .pipe(NamingfaceValidator())
});

gulp.task('validate-manifest', function () {
  return gulp.src(['**/js/manifest.xml', NO_MODULES])
    .pipe(ManifestValidator())
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

gulp.task('default', ['ci-checks'])
