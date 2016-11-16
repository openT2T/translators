var OcfSchemaReader = require('openT2T/schema/OcfSchemaReader');

module.exports = OcfSchemaReader.readThingSchemaFromFilesAsync(
        require('path').join(__dirname, 'opent2t.p.light.raml')
    );
