"use strict"
"use strict"

import OS from "os"

const cpus = OS.cpus().length
const freeMem = OS.freemem()

export default {
  cpus,
  env        : process.env.AOB_ENV || "local",
  freeMem,
  memory     : (( OS.totalmem() / 1024 ) / 1024 ) / 1024,
  mq         : {
    protocol: process.env.MQ_PROTOCOL,
    hostname: process.env.MQ_HOSTNAME,
    port    : process.env.MQ_PORT,
    username: process.env.MQ_USERNAME,
    password: process.env.MQ_PASSWORD,
    queue   : process.env.MQ_QUEUE
  },
  port       : process.env.PORT,
  serviceName: process.env.SERVICE_NAME || process.env.HOSTNAME || "Unnamed Service"
}