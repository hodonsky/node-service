"use strict"

export default class Consumer {
  config
  connection
  consumer

  constructor(connection, config, callBack){
    this.connection = connection
    this.config = config

    if (!(this instanceof Consumer)) {
      return new Consumer(connection, config, callBack);
    }
    return (async () => {
      if ( !callBack === null ){
        throw new Error("No message processor declared")
      }
      try {
        await this.connection.createStream({
          stream: this.config.stream,
          arguments: { "max-length-bytes": 5 * 1e9 }
        })
      } catch ( e ) {
        console.log("ERRRRR:", e)
        if ( e.code !== 17 ) {
          throw err
        }
      }
      console.log("attach consumer", this.config)
      this.consumer = await this.connection.declareConsumer(
                              this.config,
                              callBack
                            )
      return this;
    })()
  }
  on( event, callBack){
    this.consumer.on( event, callBack )
  }
  async close(){
    return await this.consumer.close()
  }
}