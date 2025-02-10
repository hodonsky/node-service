"use strict"

const {
  MQ_HOSTNAME         : hostname,
  MQ_PASSWORD         : password,
  MQ_PORT             : port,
  MQ_USERNAME         : username
} = process.env

export default {
  env: process.env.NODE_ENV || "local",
  semVer: "0.0.0",
  mq : {
    connectionCheckDelay: 1000,
    hostname, password, port, username
  }
}