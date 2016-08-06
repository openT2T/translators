var AllJoynConverter = require("openT2T/converters/AllJoynConverter");

module.exports = AllJoynConverter.readDeviceInterfacesFromFile(
    require("path").join(__dirname, "thermostat.xml"))[0];
