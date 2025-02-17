# Node-Service

This is the service handler side of the SOA

### Prequisites ( standard AMQP 0-9-1 )
- AMQP Server/Cluster accepting connections with credentials. ( see  [`Local`](#Local) setup )
- Gateway Service(s)/Cluster(s) listening on responseTopic with CorrelationID. ([@donsky/node-gateway](https://www.npmjs.com/package/@donsky/node-gateway) )

### Impliments:
- NodeJS
- AVRO Message Standards & Schema ( dependancy: avsc )
- AMQP 0-9-1 Communication Standard ( dependancy: amqplib )
- Babel 7 & ESNext plugins ( dependancy: babel-* )


## Initialize Your Service

```javascript
// -- CommonJS --
const Service = require( "@donsky/node-service" ).default

// -- ESNext --
import Service from "@donsky/node-service"

new Service(/*
  { ...responders },
  { ...actions },
  // this[name] = [new@instantiate] require(lib)
  [
    { lib: "uuid" },
    { lib: "sha256", name: "encrypt"  }
    { lib: "./localDep", name: "dep1", instantiate: true }
  ]
*/)
```
## Configure
All of the following configurations must be handled in the env vars, or in config in the code. Examples below:

### ENV VARS

Add the following to your bashrc, or bash profile depending on environment.
I use docker-compose so I just attach them to the container environment.
These will be picked up automatically by the default config file.

```bash
export HOSTNAME=consumerService
export MQ_PROTOCOL=amqp
export MQ_HOSTNAME=rabbitmq
export MQ_PORT=5672
export MQ_USERNAME=admin
export MQ_PASSWORD=Abcd1234
export MQ_QUEUE=consumerTopic
```
###### The hostname can be a URI or a local hostname, in this example, _'rabbitmq'_ is my docker container hostname. During deploy this would change and be environment specific.

### Code
```javascript
Service.configure({
  mq:{
    username: "admin",
    password: "Abcd1234"
    hostname: "rabbitmq"
    port    : 5672,
    queue   : "consumerTopic"
  }
})
```


## Action Object Options:

```javascript
// action.js
/** 
 * Required Attributes
 */
export const consumerActionName = {
  requestAVRO : [
    { name: "firstName", type: "string" }
  ],
  responseAVRO: [
    { name: "response", type: "string" }
  ],
  errorAVRO:[
    { name: "error", type: "string" }
  ]
}
```

## Responder Function:
```javascript
consumer.js
/**
 * Consumer Action
 */
export async function consumerActionName( { firstName } ) {
  const lastName = "alwaysLast"
  return { response: lastName }
}
```

#### Example:

```javascript
"use strict"

import Service from "@donsky/node-service"

import * as actions from "./action"
import * as responders from "./consumer"

Service.configure( { mq: { queue: "consumerTopic" } } )
new Service( responders, actions, [ { lib: "uuid" } ] )
```

<br/>

> Notes:
> - Without any __actions__ and __responders__ the server should start, but it won't do much
> - This works well with PM2 (Process Manager 2)

<br/>

## Local:

May I recommend spinning up a docker environment for those prerequisites, and getting all the services talking:

```Dockerfile
# Note: I use a docker container
version: "3.8"
services:
  rabbitmq:
    image: rabbitmq:management
    ports:
     - "5672:5672"
     - "15672:15672"
    environment:
      # ${ENV_VAR} work here for values as well
      RABBITMQ_DEFAULT_USER: defaultAdmin
      RABBITMQ_DEFAULT_PASS: SomePassword
    restart: on-failure   

  service-auth:
    build:
      context: ./
    environment:
      - MQ_PROTOCOL=amqp
      - MQ_HOSTNAME=rabbitmq
      - MQ_PORT=5672
      - MQ_USERNAME=defaultAdmin
      - MQ_PASSWORD=SomePassword
      - MQ_QUEUE=consumerTopic
    depends_on:
      - rabbitmq
    restart: on-failure
```