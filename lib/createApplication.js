"use strict"

import AMQP from "amqplib"
import { fromAVRO, toAVRO } from "./avro"
import { Actions } from "AVRO/types"
const { error: errorType } = Actions

import Base from "./Base"
/**
 * Instantiates RabbitMQ connection
 */
const connectionCheckDelay = 1000
let _conn
async function start( config, serviceFunctions, actions, dependencies ) {
  try {
    const service = new Base( config, serviceFunctions, dependencies )
    const { mq: { protocol = "amqp", hostname, port, username, password } } = config
    const connection = await AMQP.connect({ protocol, hostname, port, username, password, heartbeat: 20 })
    connection.on( "error", err => {
      if ( err.message !== "Connection closing" ) {
        console.error( "AMQP::Connection: " + JSON.stringify( err ) )
      }
    })
    connection.on( "close", () => {
      console.info( "AMQP::Reconnecting" )
      setTimeout( () => process.nextTick( async () => await start() ), connectionCheckDelay )
    })
    connection.createChannel( ( error, channel ) => {
      if ( error ) {
        console.error( "CREATE CHANNEL ERROR" )
        service.log( error )
        throw error
      }
      channel.assertQueue( queue, { durable: true })
      channel.prefetch( 1 )
      channel.consume(
        queue,
        async ({ properties: { type, correlationId, replyTo }, content }) => {
          try {
            const { action, data } = fromAVRO( content, actions[type].requestAVRO )
            const response = await service[ action ]( data )

            channel.sendToQueue(
              replyTo,
              await toAVRO( { response }, actions[type].responseAVRO, true ),
              { type: `${type}Response`, correlationId }
            )
          } catch ( error ) {
            const { name, message, status, stack, userError } = error

            service.log({ error })
            try {
              channel.sendToQueue(
                replyTo,
                await toAVRO( `${errorType}Response`, {
                  error: {
                    name     : name ? name : "PrepareService::channel:consume",
                    message  : message ? message : "Unknown Error",
                    stack    : stack ? stack : "None",
                    status   : status ? status : 500,
                    userError: userError ? userError : false
                  }
                }),
                { type: `${errorType}Response`, correlationId }
              )
            } catch ( e ) {
              console.log( e )
            }
          }
        }, { noAck: true }
      )
    })
    if ( _conn ){
      _conn.emit( "AMQP:reconnected", connection )
    }
    _conn = connection
    return _conn
  } catch ( error ){
    console.error( "CONNECTION ERROR" )
    setTimeout( () => process.nextTick( async () => await start() ), connectionCheckDelay )
  }
}
export default async (...args) => _conn ? _conn : await start(...args)