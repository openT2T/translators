// In a non-test interface module, this path would be: "opent2t/converters/AllJoynConverter"
//var AllJoynConverter = require("../../../../build/lib/converters/AllJoynConverter");
var AllJoynConverter = require("openT2T/converters/AllJoynConverter");

module.exports = AllJoynConverter.readDeviceInterfacesFromFile(
    require("path").join(__dirname, "org.OpenT2T.Sample.SuperPopular.Thermostat-2.0.xml"))[0];
