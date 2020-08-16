"use strict"

import AMQP from "amqplib"
import configuration from "./config"
import { EventEmitter } from "events"
import { fromAVRO, toAVRO } from "@donsky/node-avro"

let config = { ...configuration }

/**
 * Service class
 */
export default class {
  #actions

  #config = { ...config }

  #connection
  #emit
  #emitter

  /**
   * Overwrites local config for initialization
   * @param { Object } updates - overwrites for local config
   */
  static configure( updates ) {
    config = {
      ...updates,
      ...config,
      ...Object.entries( updates )
        .reduce( ( mix, [ key, val ] ) =>
          ( {
            ...mix,
            [ key ]: config[ key ]
              ? config[ key ] instanceof Object && !( config[ key ] instanceof Array )
                ? { ...config[ key ], ...val }
                : val
              : val
          } ), {} )
    }
  }

  #reconnect(){
    this.#emit( "reconnecting" )
    setTimeout( () =>
      process.nextTick( this.#connect.bind( this ) )
    , this.#config.mq.connectionCheckDelay )
  }

  /**
   * Makes initial connection and attaches to property of same name
   */
  async #connect(){
    const {
      mq: { hostname, password, port, protocol = "amqp", username }
    } = this.#config
    try {
      this.#connection = await AMQP.connect( {
        heartbeat: 20,
        hostname,
        password,
        port,
        protocol,
        username
      } )
      this.#connection.on( "error", err => {
        this.#connection.off( "error" )
        this.#emit( "error", err )
        this.#reconnect()
      } )
      this.#connection.on( "close", () => {
        this.#connection.off( "close" )
        this.#reconnect()
      } )
      this.#emit( "connected" )
      await this.#createChannelConsumer()
    } catch ( error ){
      this.#emit( "error", error )
      this.#reconnect()
    }
  }

  /**
   * Starts the conneciton to the MQ
   * Emits connection or error from failed connection
   */
  async #createChannelConsumer(){
    try{
      const channel = await this.#connection.createChannel()
      channel.assertQueue( this.#config.mq.queue, { durable: true } )
      channel.prefetch( 1 )
      channel.consume(
        this.#config.mq.queue,
        async ( { properties: { type, correlationId, replyTo }, content } ) => {
          if ( !this.#actions[ type ] ){
            throw new TypeError( `No Function '${type}' on 'this'` )
          }
          try {
            const { data } = fromAVRO( content, this.#actions[type].requestAVRO )
            const response = await this.#actions[ type ].lambda.call( this, data )
            channel.sendToQueue(
              replyTo,
              await toAVRO( { response }, this.#actions[type].responseAVRO, { response: true } ),
              { type: `${type}Response`, correlationId }
            )
          } catch ( error ) {
            const { name, message, status, stack, userError } = error
            try {
              channel.sendToQueue(
                replyTo,
                await toAVRO( {
                  error: {
                    name : name ? name : "PrepareService::channel:consume",
                    message : message ? message : "Unknown Error",
                    stack : stack ? stack : "None",
                    status : status ? status : 500,
                    userError: userError ? userError : false
                  }
                }, {}, { error: true } ),
                { type: `ErrorResponse`, correlationId }
              )
              this.#emit( "error", error )
            } catch ( error ) {
              this.#emit( "error", error )
            }
          }
        }, { noAck: true }
      )
    } catch ( error ) {
      this.#emit( "error", error )
    } finally {
      this.#emit( "ready", this.#config.mq.queue )
    }
  }

  /**
   * Main Base contrcutor
   * @param { Object } actions - list of actions and their lambdas
   */
  constructor( actions ){
    this.#config = { ...config }
    this.#actions = { ...actions }
    this.#emitter = new EventEmitter()
    this.on = this.#emitter.on.bind( this.#emitter )
    this.#emit = this.#emitter.emit.bind( this.#emitter )
    this.#connect()
  }
}
