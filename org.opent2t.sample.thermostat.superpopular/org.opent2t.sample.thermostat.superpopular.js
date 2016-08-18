var OcfSchemaReader = require("openT2T/schema/OcfSchemaReader");

module.exports = OcfSchemaReader.readThingSchemaFromFilesAsync(
        require("path").join(__dirname, "org.opent2t.sample.thermostat.superpopular.raml")
    );
