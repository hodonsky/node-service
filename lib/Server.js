"use strict"

import createApplication from "./createApplication"
import configuration from "./config"

let config = { ...configuration }

export default class {
  static configure( updates ) {
    config = { ...config, ...updates }
  }
  constructor( responders, actions, deps ){
    return createApplication({ ...config }, responders, actions, deps )
  }
}