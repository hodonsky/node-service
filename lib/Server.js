"use strict"

import { EventEmitter } from "events"
import AMQP from "amqplib"
import { fromAVRO, toAVRO } from "@donsky/node-avro"
import configuration from "./config"

let config = { ...configuration }

export default class {
  #actions
  #config = {
    ...config,
    mq:{
      ...config.mq,
      connectionCheckDelay: 1000
    }
  }
  #connection
  #emit
  #emitter
  static configure( updates ) {
    config = {
      ...updates,
      ...config,
      ...Object.entries(updates)
        .reduce( ( mix, [ key, val ] ) =>
          ({
            ...mix,
            [ key ]: config[ key ]
                      ? { ...config[ key ], ...val }
                      : val
          }), {})
    }
  }
  async #connect(){
    if ( this.#connection ) { return true }
    const { mq: { protocol = "amqp", hostname, port, username, password, connectionCheckDelay } } = this.#config
    try {
      this.#connection = await AMQP.connect({ protocol, hostname, port, username, password, heartbeat: 20 })
      connection.on( "error", err => this.emit( "error", err ) )
      connection.on( "close", () => {
        this.emit( "reconnecting" )
        setTimeout( () => process.nextTick( async () => {
          this.#connection = null
          await this.#connect()
        }), connectionCheckDelay )
      })
    } catch (error){
      this.emit( "error", error )
      setTimeout( () => process.nextTick( async () => {
        this.#connection = null
        await this.#connect()
      }), connectionCheckDelay )
    }
  }
  async #createApplication(){
    await this.#connect()
    this.#emit( "connected")
    try{
      const channel = await this.#connection.createChannel()
      channel.assertQueue( queue, { durable: true })
      channel.prefetch( 1 )
      channel.consume(
        queue,
        async ({ properties: { type, correlationId, replyTo }, content }) => {
          if ( !this.actions[ type ] ){
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
                await toAVRO({
                  error: {
                    name     : name ? name : "PrepareService::channel:consume",
                    message  : message ? message : "Unknown Error",
                    stack    : stack ? stack : "None",
                    status   : status ? status : 500,
                    userError: userError ? userError : false
                  }
                }, this.#actions[type].errorAVRO, { error: true } ),
                { type: `ErrorResponse`, correlationId }
              )
              this.emit( "error", error )
            } catch ( error ) {
              this.emit( "error", error )
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
    this.on = this.#emitter.on
    this.#emit = this.#emitter.emit
    this.#createApplication()
  }
  /**
  * returns copy of current config
  */
  get config (){
    return { ...this.#config }
  }
}
