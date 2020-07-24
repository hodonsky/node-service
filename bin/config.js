"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  env: process.env.AOB_ENV || "local",
  mq: {
    protocol: process.env.MQ_PROTOCOL,
    hostname: process.env.MQ_HOSTNAME,
    port: process.env.MQ_PORT,
    username: process.env.MQ_USERNAME,
    password: process.env.MQ_PASSWORD,
    queue: process.env.MQ_QUEUE
  },
  serviceName: process.env.SERVICE_NAME || process.env.HOSTNAME || "Unnamed Service"
};
exports.default = _default;