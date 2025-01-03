"use strict"

export default class Publisher {
  connection
  stream
  publisher

  constructor( connection, stream ){
    this.connection = connection
    this.stream = stream
    if (!(this instanceof Publisher)) {
      return new Publisher(connection, stream);
    }
    return (async () => {
      try {
        await this.connection.createStream({
          stream: this.stream,
          arguments: { "max-length-bytes": 5 * 1e9 }
        })
      } catch ( e ) {
        if ( !e.message.includes("code 17") ) {
          throw e
        }
      }
      try {
        this.publisher = await this.connection.declarePublisher({
          stream: this.stream,
          publisherRef: `publisherRef-${new Date().getTime()}`
        })
        this.publisher.on('error', ( err ) =>  console.error( err ) );
      } catch ( e ) {
        console.error(e)
        throw e
      }
      return this;
    })()
  }
  on( event, callBack ){
    this.publisher.on( event, callBack )
  }
  send( buffer ){
    this.publisher.send( buffer )
  }
  close(){
    return this.publisher.close()
  }
}