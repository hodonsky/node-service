"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _createApplication = _interopRequireDefault(require("./createApplication"));

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var config = _objectSpread({}, _config.default);

class _default {
  static configure(updates) {
    config = _objectSpread(_objectSpread(_objectSpread({}, updates), config), Object.entries(updates).reduce((mix, _ref) => {
      var [key, val] = _ref;
      return _objectSpread(_objectSpread({}, mix), {}, {
        [key]: config[key] ? _objectSpread(_objectSpread({}, config[key]), val) : val
      });
    }, {}));
  }

  constructor(responders, actions, deps) {
    return (0, _createApplication.default)(_objectSpread({}, config), responders, actions, deps);
  }

}

exports.default = _default;