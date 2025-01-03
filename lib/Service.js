"use strict"

import assert from "assert"
import Base from "./Base"
import configuration from "./config"
import Connector from "./Connector"
import * as rabbit from "rabbitmq-stream-js-client"
import { fromAVRO, toAVRO } from "@donsky/node-avro"
import { merge } from "./objectFunctions"
import { InterfaceError } from "./errorTypes"
import { Consumer, Publisher, compareServiceAction } from "./extensions"

let config = { ...configuration }

const SN_SERVICE_ACTIVE_NAMES = Symbol( "Service-ActiveNames" )
const SN_SERVICE_NAMED_VERSIONS = Symbol( "Service-NamedVersions" )
const QN_SERVICE_NAME_TOGGLE = Symbol( "ServiceName-Toggle" )


/**
 * Service class
 */
export default class Service extends Base {
  #actions

  #queueConnection
  #serviceChannel
  #streamConnection

  /**
   * Overwrites local config for initialization
   * @param { Object } updates - overwrites for local config
   */
  static configure( updates ) {
    config = merge( config, updates )
  }

  /**
   * Main Base contrcutor
   * @param { Object } actions - list of actions and their lambdas
   */
  constructor( actions ){
    super()
    this.#actions = {...Object.entries( actions ).reduce( ( wrapper, [ key, value]  ) => {
      wrapper[ key ] = {
        ...value,
        requestTransformers: value.requestTransformers.map( fn => fn.toString() ),
        responseTransformers: value.responseTransformers.map( fn => fn.toString() )
      }
      return wrapper
    }, {}) }

    if (!(this instanceof Service)) {
      return new Service(actions)
    }

    return (async () => {
      // Asynchronous operation
      this.#actions = {...Object.entries( actions ).reduce( ( wrapper, [ key, value]  ) => {
        wrapper[ key ] = {
          ...value,
          requestTransformers: value.requestTransformers.map( fn => fn.toString() ),
          responseTransformers: value.responseTransformers.map( fn => fn.toString() )
        }
        return wrapper
      }, {}) };
      await this.#connect()
      this.on( "processKill", () => this.#deconstruct() )
      return this; // Return the initialized object
    })();
  }

  #deconstruct(){
    console.log( "Destruction of Service: ${config.topic}" )
    this.#queueConnection?.close()
    this.#streamConnection?.close()
  }

  /**
   * Makes initial connection and attaches to property of same name
   */
  async #connect(){
    Connector.configure( config.mq )

    this.#queueConnection = await Connector.queueConnection()
    this.#streamConnection = await Connector.streamConnection()
    
    this.#queueConnection.on( "error", error => {
      this.emit( "error", error )
    })
    await this.#discoverServices()
    await this.#createChannelConsumer()
  }

  #reconnect(){
    this.emit( "reconnecting" )
    setTimeout( () =>
      process.nextTick( this.#connect.bind( this ) )
    , config.mq.connectionCheckDelay )
  }
  /**
   * Registers the service with the queue for discovery
   */
  async #discoverServices() {
    if ( !this.#actions == {} ){
      throw new InterfaceError({
        message: "No valid actions. This service won't be discoverable by the gateway automatically and is basically useless anyways. Why did you start the service without any actions?",
        statusCode: 404,
        statusMessage: `actions: ${JSON.parse(this.#actions)}`
      })
    }
    if ( !config.topic ) {
      throw new InterfaceError({
        message: "No valid topic[hostname]. This service won't be discoverable by the gateway automatically",
        statusCode: 404,
        statusMessage: `config.mq.hostname: ${config.topic}`
      })
    }
    const streamProcessor = async ( stream, offset, postDataElements = [], filter = {} ) => {
      const list = []
      try {
        await new Promise( async ( resolve, reject ) => {
          try {
            const consumerRef = `my-consumer-ref-${new Date().getTime()}`
            const consumerArgs = { stream, offset, consumerRef }
            if( filter && JSON.stringify(filter) !== "{}" ) consumerArgs.filter = filter
            let timeout;
            const consumer = await new Consumer(
                                        this.#streamConnection,
                                        consumerArgs,
                                        async ( message ) => {
                                          clearTimeout(timeout)
                                          timeout = setTimeout(()=>{
                                            clearTimeout(timeout)
                                            consumer.close()
                                            console.log("resolve after message")
                                            resolve()
                                          },500)
                                          //console.log( "MESSAGE content: ", message.content.toString() )
                                          message.content.toString() |> JSON.parse |> list.push
                                        })
            timeout = setTimeout(()=>{
              clearTimeout(timeout)
              consumer.close()
              console.log("resolve with no message")
              resolve()
            },1000)
          } catch ( e ){
            console.error(e)
            reject( e )
          }
        })
        //console.log("postDataElements", postDataElements)
        //console.log("list", list)
        for ( const element of  postDataElements ){
          let elementExists = false;
          for ( const listElem of list ){
            try {
              if( typeof listElem ==='string' ){
                assert.deepEqual(element, listElem);
                elementExists=true;
                break;
              }
              if ( typeof listElem === 'object' ){
                compareServiceAction(element, listElem )
                elementExists=true
                break;
              }
            } catch ( e ) {
              console.log("catch error", e )
              continue;
            }
          }
          if ( !elementExists ){
            const publisher = await new Publisher(this.#streamConnection, stream )
            await publisher.send( element |> JSON.stringify |> Buffer.from , { topic: config.topic })
            await publisher.close()
          }
        }
      } catch (e){
        console.log("StreamProcessor ERROR: ", e )
        throw e
      }
    }
    // const streamVersionFilter = {
    //   values: [ config.topic ],
    //   postFilterFunc: (msg) => msg.topic === config.topic,
    //   matchUnfiltered: true
    // }
    try {
      await streamProcessor( SN_SERVICE_ACTIVE_NAMES.description, rabbit.Offset.first(), [ config.topic ] )
      await streamProcessor( SN_SERVICE_NAMED_VERSIONS.description, rabbit.Offset.first(), [`${config.topic}-${config.semVer}`]/*, streamVersionFilter */)
      await streamProcessor( `Service-${config.topic}-${config.semVer}-Actions`, rabbit.Offset.first(), Object.entries( this.#actions ).map( ( [_,action] ) => action ) ) 
    } catch (e){
      console.error(e)
    }
    this.emit( "actionsRegistered", this.#actions )
  }
  /**
   * Starts the connection to the MQ
   * Emits connection or error from failed connection
   */
  async #createChannelConsumer() {
    try{
      this.#serviceChannel = await this.#queueConnection.createChannel()
      this.#serviceChannel.assertQueue( config.topic, { durable: true } )
      this.#serviceChannel.prefetch( 1 )
      this.#serviceChannel.consume(
        config.topic,
        async ( { properties: { type, correlationId, replyTo }, content } ) => {
          if ( !this.#actions[ type ] ){
            throw new TypeError( `No Function '${type}' on 'this'` )
          }
          try {
            const { data } = fromAVRO( content, this.#actions[type].requestAVRO )
            const response = await this.#actions[ type ].lambda.call( this, data )
            this.#serviceChannel.sendToQueue(
              replyTo,
              await toAVRO( { response }, this.#actions[type].responseAVRO, { response: true } ),
              { type: `${type}Response`, correlationId }
            )
          } catch ( error ) {
            const { name, message, status, stack, userError } = error
            try {
              this.#serviceChannel.sendToQueue(
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
              this.emit( "error", error )
            } catch ( error ) {
              this.emit( "error", error )
            }
          }
        }, { noAck: true }
      )
    } catch ( error ) {
      this.emit( "error", error )
    } finally {
      this.emit( "ready", config.topic )
    }
  }
}