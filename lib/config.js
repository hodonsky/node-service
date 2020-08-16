"use strict"

export default {
  env: process.env.NODE_ENV || "local",
  mq : {
    connectionCheckDelay: 1000,
    hostname            : process.env.MQ_HOSTNAME,
    password            : process.env.MQ_PASSWORD,
    port                : process.env.MQ_PORT,
    protocol            : process.env.MQ_PROTOCOL,
    queue               : process.env.MQ_QUEUE,
    username            : process.env.MQ_USERNAME
  }
}