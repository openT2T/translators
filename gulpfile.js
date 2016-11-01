var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');

gulp.task('xml-lint', function () {
  return gulp.src('**/*.xml')
    .pipe(xmlValidator())
});