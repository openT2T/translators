/**
 * This file exports constants used by the Insteon translators
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

define("ResourceNotMutable", 'Resource is not mutable');