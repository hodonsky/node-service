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

  #config = {
    ...config,
    mq: {
      ...config.mq,
      connectionCheckDelay: 1000
    }
  }

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
              ? { ...config[ key ], ...val }
              : val
          } ), {} )
    }
  }

  /**
   * Makes initial connection and attaches to property of same name
   */
  async #connect(){
    if ( this.#connection ) { return true }
    const {
      mq: {
        connectionCheckDelay,
        hostname,
        password,
        port,
        protocol = "amqp",
        username
      }
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
      this.#connection.on( "error", err => this.#emit( "error", err ) )
      this.#connection.on( "close", () => {
        this.#emit( "reconnecting" )
        setTimeout( () => process.nextTick( async () => {
          this.#connection = null
          await this.#connect()
        } ), connectionCheckDelay )
      } )
    } catch ( error ){
      this.#emit( "error", error )
      setTimeout( () => process.nextTick( async () => {
        this.#connection = null
        await this.#connect()
      } ), connectionCheckDelay )
    }
  }

  /**
   * Starts the conneciton to the MQ
   * Emits connection or error from failed connection
   */
  async #createChannelConsumer(){
    try{
      await this.#connect()
      this.#emit( "connected" )
    } catch ( err ) {
      this.#emit( "error", err )
    }
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
    this.#createChannelConsumer()
  }

  /**
  * returns copy of current config
  */
  get config(){
    return { ...this.#config }
  }
}
