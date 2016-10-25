var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');
var eslint = require('gulp-eslint');

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

gulp.task('ci-checks', ['js-lint', 'json-lint', 'xml-lint']);
