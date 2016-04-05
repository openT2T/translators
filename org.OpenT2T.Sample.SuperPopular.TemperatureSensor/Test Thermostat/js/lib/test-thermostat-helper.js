// Helper library for the test thermostat
'use strict';

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Statistics() {

}

/// <summary>
/// Return the Mean of the given numbers.
/// </summary>
Statistics.mean = function(values) {
    var sum = 0;
    var len = values.length;
    if (len == 0) return 0;
    for (var i = 0; i < len; i++) {
        var d = values[i];
        sum += d;
    }
    return sum / len;
}

/// <summary>
/// Return x coordinates from array of Point objects
/// </summary>
Statistics.xCoords = function(pts) {
    var sum = 0;
    var len = pts.length;
    if (len == 0) return [];
    var result = new Array(len);
    for (var i = 0; i < len; i++) {
        var pt = pts[i];
        result[i] = pt.x;
    }
    return result;
}


/// <summary>
/// Return y coordinates from array of Point objects
/// </summary>
Statistics.yCoords = function(pts) {
    var sum = 0;
    var len = pts.length;
    if (len == 0) return [];
    var result = new Array(len);
    for (var i = 0; i < len; i++) {
        var pt = pts[i];
        result[i] = pt.y;
    }
    return result;
}

/// <summary>
/// Compute the trend line through the given points, and return the line in the form:
///     y = a + b.x
/// </summary>
/// <param name="pts">The data to analyze</param>
/// <returns>The y-coordinate of the line at x = 0 and the slope in a 2 element array</returns>
Statistics.linearRegression = function(pts) {
    var a, b;
    var xs = Statistics.xCoords(pts);
    var ys = Statistics.yCoords(pts);
    var xMean = Statistics.mean(xs);
    var yMean = Statistics.mean(ys);
    var xVariance = Statistics.variance(xs);
    var yVariance = Statistics.variance(ys);
    var covariance = Statistics.covariance(pts);
    if (xVariance == 0) {
        a = yMean;
        b = 1;
    }
    else {
        b = covariance / xVariance;
        a = yMean - (b * xMean);
    }
    return [a, b];
}

/// <summary>
/// Return the variance, sum of the difference between each value and the mean, squared.
/// </summary>
Statistics.variance = function(values) {
    var mean = Statistics.mean(values);
    var variance = 0;
    var len = values.length;
    if (len == 0) return 0;
    for (var i = 0; i < len; i++) {
        var d = values[i];
        var diff = (d - mean);
        variance += (diff * diff);
    }
    return variance;
}

/// <summary>
/// Return the covariance in the given x,y values.
/// The sum of the difference between x and its mean times the difference between y and its mean.
/// </summary>
Statistics.covariance = function(pts) {
    var xsum = 0;
    var ysum = 0;
    var len = pts.length;
    if (len == 0) return 0;
    for (var i = 0; i < len; i++) {
        var d = pts[i];
        xsum += d.x;
        ysum += d.y;
    }
    var xMean = xsum / len;
    var yMean = ysum / len;
    var covariance = 0;
    for (i = 0; i < len; i++) {
        var d = pts[i];
        covariance += (d.x - xMean) * (d.y - yMean);
    }
    return covariance;
}

module.exports['Statistics'] = Statistics;
module.exports['Point'] = Point;