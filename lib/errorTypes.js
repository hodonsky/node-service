"use strict"

export class InterfaceError extends TypeError {
  constructor(argsObj){
    const { message, statusCode, statusMessage } = argsObj
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.statusMessage = statusMessage
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
    } else {
        this.stack = (new Error(message)).stack;
    }
  }
}