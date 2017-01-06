/* 
 * We use British variant spelling here to align with the OCF spec 
 * (https://openconnectivity.org/specs/OIC_1.1-Specification.zip
 * see OIC_Resource_Type_Specification_v1.1.0.pdf)
 *
 */

"use strict";

const ChangeTolerance = 0.0001;
const MaxHue = 360.0;
const MaxColour = 255;

/*
 * Method to see if the given XY value is within the reach of the lamps.
 * 
 * Details on the math theory is avaialble at http://mathworld.wolfram.com/TriangleInterior.html
 * and https://en.wikipedia.org/wiki/Barycentric_coordinate_system
 *
 * @param xyColour is a two-element object representing a point containing the X,Y value
 * @param colourGamut   the color gamut of the light device.
 * @return true if within reach, false otherwise.
 */
function isPointInLampsReach(xyColour, colourGamut){

    //Calculate vectors based on colourGamut[0]
    var v1 = [colourGamut[1].x - colourGamut[0].x, colourGamut[1].y - colourGamut[0].y];
    var v2 = [colourGamut[2].x - colourGamut[0].x, colourGamut[2].y - colourGamut[0].y];
    var v = [xyColour.x - colourGamut[0].x, xyColour.y - colourGamut[0].y];

    //Calculate the barycentric coordinates
    var a = determinant(v, v2) / determinant(v1, v2);
    var b = determinant(v1, v) / determinant(v1, v2);

    return ((a >= 0) && (b >= 0) && (a + b <= 1)) ? true : false;
}

function determinant(point1, point2) {
    return ((point1.x * point2.y) - (point1.y * point2.x));
}

/*
 * Find the closest point on a line.
 * This point will be within reach of the lamp.
 *
 * Details on the math theory is avaiable at 
 * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#A_vector_projection_proof
 *
 * @param pointA the point where the line starts
 * @param pointB the point where the line ends
 * @param pointP the point which is close to a line.
 * @return the point which is on the line.
 */
function getClosestPointToPoints(pointA, pointB, pointP){

    var vectorAP = { x: (pointP.x - pointA.x), y: (pointP.y - pointA.y) };
    var vectorAB = { x: (pointB.x - pointA.x), y: (pointB.y - pointA.y) };
    var abSquared = (vectorAB.x * vectorAB.x) + (vectorAB.y * vectorAB.y);
    var apDotab = (vectorAP.x * vectorAB.x) + (vectorAP.y * vectorAB.y);

    var normalizedDistToClosest = apDotab / abSquared;
    if (normalizedDistToClosest < 0.0)
    {
        normalizedDistToClosest = 0.0;
    }
    else if (normalizedDistToClosest > 1.0)
    {
        normalizedDistToClosest = 1.0;
    }

    //Add the normalized distance to pointA, moving towards B.
    return { x: (pointA.x + (vectorAB.x * normalizedDistToClosest)), y: (pointA.y + (vectorAB.y * normalizedDistToClosest)) };
}

/*
 * Find the distance between two points.
 *
 * @param point1
 * @param point2
 * @return the distance between point one and two
 */
function getDistanceBetweenTwoPoints(point1, point2){
    var deltaX = point1.x - point2.x; // horizontal difference
    var deltaY = point1.y - point2.y; // vertical difference
    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
}

/*
 * Returns colour gamut based on the light device's model.
 * Reference to https://developers.meethue.com/documentation/supported-lights.
 */

function getColourGamutForModel(modelId)
{
    var output = [ {x:1, y:0}, {x:0, y:1}, {x:0, y:0}];
    switch (modelId)
    {
        case "LST001":
        case "LLC006":
        case "LLC007":
        case "LLC010":
        case "LLC011":
        case "LLC012":
        case "LLC013":
            //Colour Gamut A
            output[0] = {x:0.704, y:0.296};        //Red
            output[1] = {x:0.2151, y:0.7106};      //Green
            output[2] = {x:0.138, y:0.08};         //Blue
            break;
        case "LCT001":
        case "LCT002":
        case "LCT003":
        case "LCT007":
        case "LLM001":
            //Colour Gamut B
            output[0] = {x:0.675, y:0.322};    //Red
            output[1] = {x:0.409, y:0.518};    //Green
            output[2] = {x:0.167, y:0.04};     //Blue
            break;
        case "LLC020":
        case "LST002":
            //Colour Gamut C
            output[0] = {x:0.692, y:0.308};    //Red
            output[1] = {x:0.17, y:0.7};    //Green
            output[2] = {x:0.153, y:0.048};     //Blue
            break;
        default:
            break;
    }

    return output;
}


/*
 * This class provides methods to convert XY colour to RGB value and vice versa.
 * Details on Hue's colour conversion formula for XY colour space is available at 
 * https://developers.meethue.com/documentation/color-conversions-rgb-xy.
 * Methods for converting between HSV and RGB colours are inclued as well.
 *
 */

class Colour {

    /**
     * Convert HSV to RGB colour
     *
     * @param hue is a value between 0 and 360
     * @param saturation is a value between 0 and  1 
     * @param lumosity(Brightness) is a value between 0 and  1 
     *
     * @return RGB colour in a 3-element array of values in between 0 amd 255
     */
    static HSVtoRGB(hue, saturation, lumosity) {
        var hi = Math.floor(hue / 60) % 6;
        var c = saturation * lumosity;
        var x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        var m = lumosity - c;

        var result;

        switch (hi) {
            case 0:
                result = [c, x, 0];
                break;
            case 2:
                result = [x, c, 0];
                break;
            case 3:
                result = [0, c, x];
                break;
            case 4:
                result = [0, x, c];
                break;
            case 5:
                result = [x, 0, c];
                break;
            default:
                result = [c, 0, x];
                break;
        }

        return [(result[0] + m) * MaxColour, (result[1] + m) * MaxColour, (result[2] + m) * MaxColour]
    }

    /**
     * Convert RGB to HSV colours
     * @param rgbValue  RGB colour values are in [0 ... 255].
     */
    static RGBtoHSV(rgbValue) {
        var red = rgbValue[0] / MaxColour;
        var green = rgbValue[1] / MaxColour;
        var blue = rgbValue[2] / MaxColour;

        var min = Math.min(red, green, blue);
        var max = Math.max(red, green, blue);
        var delta = max - min;

        // fraction to byte
        var hue = 0, saturation = 0;

        if (Math.abs(max) > ChangeTolerance)
            saturation = delta / max;
        else {
            // don't update Hue or saturation
            return undefined;
        }

        if (Math.abs(delta) < ChangeTolerance)
            return undefined;

        if (Math.abs(red - max) < ChangeTolerance)
            hue = (green - blue) / delta; // between yellow & magenta
        else if (Math.abs(green - max) < ChangeTolerance)
            hue = 2 + (blue - red) / delta; // between cyan & yellow
        else
            hue = 4 + (red - green) / delta; // between magenta & cyan

        hue *= 60; // degrees
        if (hue < 0)
            hue += MaxHue;
        if (hue > MaxHue)
            hue -= MaxHue;

        return {
            'hue': hue,
            'saturation': saturation,
            'level': max
        }
    }

    /**
     * Convert XY to RGB colours
     * @param xyColour is an two-element object { x:<x_value>, y:<y_value> }
     * @param modelId is the model ID of the lights
     *
     * @return RGB colour in a 3-element array of values in between 0 amd 255
     */
    static XYtoRGB(xyColour, modelId) {
        var xy = xyColour;
        var colourGamut = getColourGamutForModel(modelId);
        var inReachOfLamps = isPointInLampsReach(xyColour, colourGamut);

        if (!inReachOfLamps)
        {
            //It seems the colour is out of reach
            //let's find the closest colour we can produce with our lamp and send this XY value out.

            //Find the closest point on each line in the triangle.
            var pAB = getClosestPointToPoints(colourGamut[0], colourGamut[1], xy);
            var pAC = getClosestPointToPoints(colourGamut[2], colourGamut[1], xy);
            var pBC = getClosestPointToPoints(colourGamut[1], colourGamut[2], xy);

            //Get the distances per point and see which point is closer to our Point.
            var dAB = getDistanceBetweenTwoPoints(xyColour, pAB);
            var dAC = getDistanceBetweenTwoPoints(xyColour, pAC);
            var dBC = getDistanceBetweenTwoPoints(xyColour, pBC);

            var lowest = dAB;
            var closestPoint = pAB;

            if (dAC < lowest)
            {
                lowest = dAC;
                closestPoint = pAC;
            }
            if (dBC < lowest)
            {
                lowest = dBC;
                closestPoint = pBC;
            }

            //Change the xy value to a value which is within the reach of the lamp.
            xy.x = closestPoint.x;
            xy.y = closestPoint.y;
        }

        var z = 1.0 - xy.x - xy.y;

        var Y = 1.0;
        var X = (Y / xy.y) * xy.x;
        var Z = (Y / xy.y) * z;

        // sRGB D65 conversion
        var r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        var g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        var b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

        var maxValue = Math.max(r, g, b);
        if (maxValue > 1.0)
        {
            r /= maxValue;
            g /= maxValue;
            b /= maxValue;
        }

        // Apply gamma correction
        r = r <= 0.0031308 ? 12.92 * r : ((1.0 + 0.055) * Math.pow(r, (1.0 / 2.4))) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : ((1.0 + 0.055) * Math.pow(g, (1.0 / 2.4))) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : ((1.0 + 0.055) * Math.pow(b, (1.0 / 2.4))) - 0.055;

        maxValue = Math.max(r, g, b);
        if (maxValue > 1.0)
        {
            r /= maxValue;
            g /= maxValue;
            b /= maxValue;
        }

        return [Math.round((r > 0 ? r : 0) * 255),
                Math.round((g > 0 ? g : 0) * 255),
                Math.round((b > 0 ? b : 0) * 255) ];  //RGB (A: 1.0f)
    }

    /**
     * Convert RGB to XY colours
     * @Param rgbValue is RGB colour values in [0 ... 255]
     * @Return xyColour is an two-element object { x:<x_value>, y:<y_value> }
     */
    static RGBtoXY(rgbValue, modelID) {
        var outputPoint;

        // Apply gamma correction
        var r = (rgbValue[0] > 0.04045) ? Math.pow((rgbValue[0] + 0.055) / (1.0 + 0.055), 2.4) : (rgbValue[0] / 12.92);
        var g = (rgbValue[1] > 0.04045) ? Math.pow((rgbValue[1] + 0.055) / (1.0 + 0.055), 2.4) : (rgbValue[1] / 12.92);
        var b = (rgbValue[2] > 0.04045) ? Math.pow((rgbValue[2] + 0.055) / (1.0 + 0.055), 2.4) : (rgbValue[2] / 12.92);

        // Wide gamut conversion D65
        var X = r * 0.664511 + g * 0.154324 + b * 0.162028;
        var Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
        var Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

        var cx = X / (X + Y + Z);
        var cy = Y / (X + Y + Z);

        if (isNaN(cx))
        {
            cx = 0.0;
        }

        if (isNaN(cy))
        {
            cy = 0.0;
        }

        //Check if the given XY value is within the colourreach of our lamps.
        outputPoint = {x:cx, y:cy};
        var colorGamut = getColourGamutForModel(modelID);
        var inReachOfLamps = isPointInLampsReach(outputPoint, colorGamut);

        if (!inReachOfLamps)
        {
            //It seems the colour is out of reach
            //let's find the closest colour we can produce with our lamp and send this XY value out.

            //Find the closest point on each line in the triangle.
            var pAB = getClosestPointToPoints(colorGamut[0], colorGamut[1], outputPoint);
            var pAC = getClosestPointToPoints(colorGamut[2], colorGamut[0], outputPoint);
            var pBC = getClosestPointToPoints(colorGamut[1], colorGamut[2], outputPoint);

            //Get the distances per point and see which point is closer to our Point.
            var dAB = getDistanceBetweenTwoPoints(outputPoint, pAB);
            var dAC = getDistanceBetweenTwoPoints(outputPoint, pAC);
            var dBC = getDistanceBetweenTwoPoints(outputPoint, pBC);

            var lowest = dAB;
            var closestPoint = pAB;

            if (dAC < lowest)
            {
                lowest = dAC;
                closestPoint = pAC;
            }
            if (dBC < lowest)
            {
                lowest = dBC;
                closestPoint = pBC;
            }

            //Change the xy value to a value which is within the reach of the lamp.
            outputPoint = {x:closestPoint.x, y:closestPoint.y};
        }

        return { x:outputPoint.x, y:outputPoint.y};
    }
}

exports.Colour = Colour;