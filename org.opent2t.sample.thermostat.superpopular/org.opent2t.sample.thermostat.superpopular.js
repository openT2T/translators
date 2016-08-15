var OcfConverter = require("openT2T/converters/OcfConverter");

module.exports = OcfConverter.readDeviceInterfacesFromFiles(
    require("path").join(__dirname, "org.opent2t.sample.thermostat.superpopular.raml"),
    require("path").join(__dirname, "org.opent2t.sample.thermostat.superpopular.json")
)[0];
