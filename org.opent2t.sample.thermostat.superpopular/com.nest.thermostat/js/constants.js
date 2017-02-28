/**
 * This file exports constants used by the Nest translators
 */

/** 
 * Defines a new property on exports with the name, and value.
 * This value is not writable, so acts as a true exported constant.
 */
function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true,
        writable: false,
        configurable: false
    });
}

define("SchemaMissingTemperature", 'Resource schema missing temperature units.');
define("ResourceNotMutable", 'Resource is not mutable');