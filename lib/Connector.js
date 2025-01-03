"use strict"

import AMQP from "amqplib"
import * as rabbit from "rabbitmq-stream-js-client"
import Base from "./Base"
import { merge } from "./utils"

const connectionCheckDelay = 1000
let sharedConnectionOptions = {
  hostname: null,
  password: null,
  port: null,
  username: null
}


export default class Connector extends Base {
  #queueMQConn
  #queueConnected = false
  #streamMQConn
  #streamConnected = false

  static configure( updates ){
    sharedConnectionOptions = merge( sharedConnectionOptions, updates )
  }
  async #connectQueue(){
    try {
      this.#queueMQConn = await AMQP.connect({
        ...sharedConnectionOptions, 
        protocol : "amqp",
        heartbeat: 60
      })
    } catch ( e ) {
      console.error( e )
    }
    this.#queueMQConn.on( "error", err =>
      ( err.message !== "Connection closing" )
      ? conn.emit( "AMQP:error", err )
      : null
    )
    this.#queueMQConn.on( "close", () =>
      setTimeout( () => 
        process.nextTick( async () => await this.#connectQueue() ), connectionCheckDelay
      )
    )
  }
  async #connectStream(){
    try {
      this.#streamMQConn = await rabbit.connect({
        ...sharedConnectionOptions,
        host: sharedConnectionOptions.hostname,
        port: 5552,
        vhost: "/",
        addressResolver: { enabled: true },
        listeners: {
          oncomplete: async () => {
            console.log( "complete args:", arguments )
          },
          connection_closed: async () => {
            console.log( "connection_closed args:", arguments )
            console.info(`In connection closed event...`)
            try {
              await this.#streamMQConn.restart()
              console.log( "restarted stream connection to rabbit" )
            } catch ( error ) {
              console.error(`Could not reconnect to Rabbit!`, error)
            }
          }
        }
      }/*, console */)
      //this.#streamMQConn.connection.serverEndpoint.host = sharedConnectionOptions.hostname
    } catch ( e ) {
      console.error( e )
    }
  }
  constructor(){
    super()
  }
  static async queueConnection(){
    const conn = new Connector()
    if ( !conn.#queueConnected ){
      await conn.#connectQueue()
    }
    return conn.#queueMQConn
  }
  static async streamConnection(){
    const conn = new Connector()
    if ( !conn.#streamConnected ){
      await conn.#connectStream()
    }
    return conn.#streamMQConn
  }
}