"use strict"

/**
 * Base class
 */
export default class {
  #config = {
    dependencies: []
  }
  /**
   * Main Base contrcutor
   * @param { Object } config
   */
  constructor( config, functionsDictionary, dependencies = [] ){
    this.#config = { ...config }
    dependencies.forEach( dep => this.attach( dep.name ? dep.name : dep.lib, dep.lib, dep.instantiate ) )
    if ( functionsDictionary ) {
      this.extend( functionsDictionary )
    }
    this.initializeService()
  }
  /**
   * 
   * @param { String } name - name of the property on this instance for this dependency
   * @param { String } Dependency - Dependency import
   * @param { Boolean } wether to instantiate or not. Defaults to false
   */
  attach( name, lib, instantiate = false ){
    const required = require( lib )
    const Dependency = required.default ? required.default : required
    this[ name ] = !instantiate ? Dependency : new Dependency()
  }
  /**
   * Extends the objects functionality during instantiation
   * @param { Object } functionsDictionary - the dictionary list of functions to extend the 'active' service with.
   */
  extend( functionsDictionary ){
    Object.keys( functionsDictionary ).forEach( key => {
      this[ key ] = functionsDictionary[ key ]
    })
    return this
  }
  /**
   * service initialization callback handler
   */
  initializeService(){
    if ( this.onServiceInit && this.onServiceInit instanceof Function ) {
      process.nextTick( this.onServiceInit.bind( this ))
    }
  }
  /**
   * Logger for multi-environment setup
   * @param { Object } body - body object that includes message
   * @param { String } serverity - string representation of severity eg: "error", "info", "debug"
   */
  log( body, severity = "debug" ) {
    try {
      body = typeof body === "string" ? { [ severity ]: { message: body } } : body
      body = body.error ?
        {
          error: {
            name   : body.error.name ? body.error.name : "Error",
            message: body.error.message ? body.error.message : "Undefined error."
          }
        } :
        body
      console[ severity ]({
        ...body,
        timestamp: new Date().getTime(),
        service  : this.#config.serviceName || "Unnamed service or worker",
      })
    } catch ( error ) {
      console.trace( error )
      console.error( error )
    }
  }
}
