"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = require("events");

var _amqplib = _interopRequireDefault(require("amqplib"));

var _nodeAvro = require("@donsky/node-avro");

var _config2 = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var config = _objectSpread({}, _config2.default);

var _actions = new WeakMap();

var _config = new WeakMap();

var _connection = new WeakMap();

var _emit = new WeakMap();

var _emitter = new WeakMap();

var _connect = new WeakSet();

var _createApplication = new WeakSet();

class _default {
  static configure(updates) {
    config = _objectSpread(_objectSpread(_objectSpread({}, updates), config), Object.entries(updates).reduce((mix, _ref) => {
      var [key, val] = _ref;
      return _objectSpread(_objectSpread({}, mix), {}, {
        [key]: config[key] ? _objectSpread(_objectSpread({}, config[key]), val) : val
      });
    }, {}));
  }

  /**
   * Main Base contrcutor
   * @param { Object } actions - list of actions and their lambdas
   */
  constructor(actions) {
    _createApplication.add(this);

    _connect.add(this);

    _actions.set(this, {
      writable: true,
      value: void 0
    });

    _config.set(this, {
      writable: true,
      value: _objectSpread(_objectSpread({}, config), {}, {
        mq: _objectSpread(_objectSpread({}, config.mq), {}, {
          connectionCheckDelay: 1000
        })
      })
    });

    _connection.set(this, {
      writable: true,
      value: void 0
    });

    _emit.set(this, {
      writable: true,
      value: void 0
    });

    _emitter.set(this, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _config, _objectSpread({}, config));

    _classPrivateFieldSet(this, _actions, _objectSpread({}, actions));

    _classPrivateFieldSet(this, _emitter, new _events.EventEmitter());

    this.on = _classPrivateFieldGet(this, _emitter).on.bind(_classPrivateFieldGet(this, _emitter));

    _classPrivateFieldSet(this, _emit, _classPrivateFieldGet(this, _emitter).emit.bind(_classPrivateFieldGet(this, _emitter)));

    _classPrivateMethodGet(this, _createApplication, _createApplication2).call(this);
  }
  /**
  * returns copy of current config
  */


  get config() {
    return _objectSpread({}, _classPrivateFieldGet(this, _config));
  }

}

exports.default = _default;

var _connect2 = /*#__PURE__*/function () {
  var _connect3 = _asyncToGenerator(function* () {
    var _this = this;

    if (_classPrivateFieldGet(this, _connection)) {
      return true;
    }

    var {
      mq: {
        protocol = "amqp",
        hostname,
        port,
        username,
        password,
        connectionCheckDelay
      }
    } = _classPrivateFieldGet(this, _config);

    try {
      _classPrivateFieldSet(this, _connection, yield _amqplib.default.connect({
        protocol,
        hostname,
        port,
        username,
        password,
        heartbeat: 20
      }));

      _classPrivateFieldGet(this, _connection).on("error", err => _classPrivateFieldGet(this, _emit).call(this, "error", err));

      _classPrivateFieldGet(this, _connection).on("close", () => {
        _classPrivateFieldGet(this, _emit).call(this, "reconnecting");

        setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
          _classPrivateFieldSet(_this, _connection, null);

          yield _classPrivateMethodGet(_this, _connect, _connect2).call(_this);
        })), connectionCheckDelay);
      });
    } catch (error) {
      _classPrivateFieldGet(this, _emit).call(this, "error", error);

      setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
        _classPrivateFieldSet(_this, _connection, null);

        yield _classPrivateMethodGet(_this, _connect, _connect2).call(_this);
      })), connectionCheckDelay);
    }
  });

  function _connect2() {
    return _connect3.apply(this, arguments);
  }

  return _connect2;
}();

var _createApplication2 = /*#__PURE__*/function () {
  var _createApplication3 = _asyncToGenerator(function* () {
    var _this2 = this;

    yield _classPrivateMethodGet(this, _connect, _connect2).call(this);

    _classPrivateFieldGet(this, _emit).call(this, "connected");

    try {
      var channel = yield _classPrivateFieldGet(this, _connection).createChannel();
      channel.assertQueue(_classPrivateFieldGet(this, _config).mq.queue, {
        durable: true
      });
      channel.prefetch(1);
      channel.consume(_classPrivateFieldGet(this, _config).mq.queue, /*#__PURE__*/function () {
        var _ref5 = _asyncToGenerator(function* (_ref4) {
          var {
            properties: {
              type,
              correlationId,
              replyTo
            },
            content
          } = _ref4;

          if (!_classPrivateFieldGet(_this2, _actions)[type]) {
            throw new TypeError("No Function '".concat(type, "' on 'this'"));
          }

          try {
            var {
              data
            } = (0, _nodeAvro.fromAVRO)(content, _classPrivateFieldGet(_this2, _actions)[type].requestAVRO);
            var response = yield _classPrivateFieldGet(_this2, _actions)[type].lambda.call(_this2, data);
            channel.sendToQueue(replyTo, yield (0, _nodeAvro.toAVRO)({
              response
            }, _classPrivateFieldGet(_this2, _actions)[type].responseAVRO, {
              response: true
            }), {
              type: "".concat(type, "Response"),
              correlationId
            });
          } catch (error) {
            var {
              name,
              message,
              status,
              stack,
              userError
            } = error;

            try {
              channel.sendToQueue(replyTo, yield (0, _nodeAvro.toAVRO)({
                error: {
                  name: name ? name : "PrepareService::channel:consume",
                  message: message ? message : "Unknown Error",
                  stack: stack ? stack : "None",
                  status: status ? status : 500,
                  userError: userError ? userError : false
                }
              }, _classPrivateFieldGet(_this2, _actions)[type].errorAVRO, {
                error: true
              }), {
                type: "ErrorResponse",
                correlationId
              });

              _classPrivateFieldGet(_this2, _emit).call(_this2, "error", error);
            } catch (error) {
              _classPrivateFieldGet(_this2, _emit).call(_this2, "error", error);
            }
          }
        });

        return function (_x) {
          return _ref5.apply(this, arguments);
        };
      }(), {
        noAck: true
      });
    } catch (error) {
      _classPrivateFieldGet(this, _emit).call(this, "error", error);
    } finally {
      _classPrivateFieldGet(this, _emit).call(this, "ready", _classPrivateFieldGet(this, _config).mq.queue);
    }
  });

  function _createApplication2() {
    return _createApplication3.apply(this, arguments);
  }

  return _createApplication2;
}();