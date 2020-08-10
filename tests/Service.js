"use strict"
const { expect } = require( "chai" )

const _Service = require( "../bin" ).default
const Service = require( "../lib/Service").default

describe( "ESNext Service", () => {
  it( "has static properties", () => {
    expect( Service ).to.have.property( "configure" )
  })
})

describe("Built Service", () => {
  it( "has static properties", () => {
    expect( _Service ).to.have.property( "configure" )
  })
})