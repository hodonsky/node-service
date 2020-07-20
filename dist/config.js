"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cpus = _os.default.cpus().length;

var freeMem = _os.default.freemem();

var _default = {
  cpus,
  env: process.env.AOB_ENV || "local",
  freeMem,
  memory: _os.default.totalmem() / 1024 / 1024 / 1024,
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