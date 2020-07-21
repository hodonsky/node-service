"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _amqplib = _interopRequireDefault(require("amqplib"));

var _nodeAvro = require("@donsky/node-avro");

var _Base = _interopRequireDefault(require("./Base"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * Instantiates RabbitMQ connection
 */
var connectionCheckDelay = 1000;

var _conn;

function start(_x, _x2, _x3, _x4) {
  return _start.apply(this, arguments);
}

function _start() {
  _start = _asyncToGenerator(function* (config, serviceFunctions, actions, dependencies) {
    var service = new _Base.default(config, serviceFunctions, dependencies);

    try {
      var {
        topic,
        mq: {
          protocol = "amqp",
          hostname,
          port,
          username,
          password
        }
      } = config;
      var connection = yield _amqplib.default.connect({
        protocol,
        hostname,
        port,
        username,
        password,
        heartbeat: 20
      });
      connection.on("error", err => {
        if (err.message !== "Connection closing") {
          console.error("AMQP::Connection: " + JSON.stringify(err));
        }
      });
      connection.on("close", () => {
        console.info("AMQP::Reconnecting");
        setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
          return yield start();
        })), connectionCheckDelay);
      });

      try {
        var channel = yield connection.createChannel();
        channel.assertQueue(topic, {
          durable: true
        });
        channel.prefetch(1);
        channel.consume(topic, /*#__PURE__*/function () {
          var _ref4 = _asyncToGenerator(function* (_ref3) {
            var {
              properties: {
                type,
                correlationId,
                replyTo
              },
              content
            } = _ref3;

            try {
              var {
                action,
                data
              } = (0, _nodeAvro.fromAVRO)(content, actions[type].requestAVRO);
              var response = yield service[action](data);
              channel.sendToQueue(replyTo, yield (0, _nodeAvro.toAVRO)({
                response
              }, actions[type].responseAVRO, {
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
              service.log({
                error
              });

              try {
                channel.sendToQueue(replyTo, yield (0, _nodeAvro.toAVRO)({
                  error: {
                    name: name ? name : "PrepareService::channel:consume",
                    message: message ? message : "Unknown Error",
                    stack: stack ? stack : "None",
                    status: status ? status : 500,
                    userError: userError ? userError : false
                  }
                }, actions[type].errorAVRO, {
                  error: true
                }), {
                  type: "".concat(errorType, "Response"),
                  correlationId
                });
              } catch (e) {
                console.log(e);
              }
            }
          });

          return function (_x5) {
            return _ref4.apply(this, arguments);
          };
        }(), {
          noAck: true
        });
      } catch (error) {
        console.error("CREATE CHANNEL ERROR");
        service.log(error);
        throw error;
      }

      if (_conn) {
        _conn.emit("AMQP:reconnected", connection);
      }

      _conn = connection;
      return _conn;
    } catch (error) {
      console.error("CONNECTION ERROR");
      setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
        return yield start();
      })), connectionCheckDelay);
    }
  });
  return _start.apply(this, arguments);
}

var _default = /*#__PURE__*/_asyncToGenerator(function* () {
  return _conn ? _conn : yield start(...arguments);
});

exports.default = _default;