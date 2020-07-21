"use strict";
/**
 * Base class
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

var _config = new WeakMap();

class _default {
  /**
   * Main Base contrcutor
   * @param { Object } config
   */
  constructor(config, functionsDictionary) {
    var dependencies = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    _config.set(this, {
      writable: true,
      value: {
        dependencies: []
      }
    });

    _classPrivateFieldSet(this, _config, _objectSpread({}, config));

    dependencies.forEach(dep => this.attach(dep.name ? dep.name : dep.lib, dep.lib, dep.instantiate));

    if (functionsDictionary) {
      this.extend(functionsDictionary);
    }

    this.initializeService();
  }
  /**
   * 
   * @param { String } name - name of the property on this instance for this dependency
   * @param { String } Dependency - Dependency import
   * @param { Boolean } wether to instantiate or not. Defaults to false
   */


  attach(name, lib) {
    var instantiate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var required = require(lib);

    var Dependency = required.default ? required.default : required;
    this[name] = !instantiate ? Dependency : new Dependency();
  }
  /**
   * Extends the objects functionality during instantiation
   * @param { Object } functionsDictionary - the dictionary list of functions to extend the 'active' service with.
   */


  extend(functionsDictionary) {
    Object.entries(functionsDictionary).forEach((_ref) => {
      var [key, fn] = _ref;
      return this[key] = fn;
    });
    return this;
  }
  /**
   * service initialization callback handler
   */


  initializeService() {
    if (this.onServiceInit && this.onServiceInit instanceof Function) {
      process.nextTick(this.onServiceInit.bind(this));
    }
  }
  /**
   * Logger for multi-environment setup
   * @param { Object } body - body object that includes message
   * @param { String } serverity - string representation of severity eg: "error", "info", "debug"
   */


  log(body) {
    var severity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "debug";

    try {
      body = typeof body === "string" ? {
        [severity]: {
          message: body
        }
      } : body;
      body = body.error ? {
        error: {
          name: body.error.name ? body.error.name : "Error",
          message: body.error.message ? body.error.message : "Undefined error."
        }
      } : body;
      console[severity](_objectSpread(_objectSpread({}, body), {}, {
        timestamp: new Date().getTime(),
        service: _classPrivateFieldGet(this, _config).serviceName || "Unnamed service or worker"
      }));
    } catch (error) {
      console.trace(error);
      console.error(error);
    }
  }

}

exports.default = _default;