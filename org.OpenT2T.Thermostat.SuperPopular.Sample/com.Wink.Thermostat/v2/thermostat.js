var AllJoynConverter = require("openT2T/converters/AllJoynConverter");

module.exports = AllJoynConverter.readDeviceInterfacesFromFile(
    require("path").join(__dirname, "org.OpenT2T.Sample.SuperPopular.Thermostat.xml"))[0];
