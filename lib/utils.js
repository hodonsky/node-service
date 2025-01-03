"use strict"

export const merge = ( config, updates ) => ( {
  ...updates,
  ...config,
  ...Object.entries( updates )
    .reduce( ( mix, [ key, val ] ) =>
      ( {
        ...mix,
        [ key ]: config[ key ]
          ? config[ key ] instanceof Object && !( config[ key ] instanceof Array )
            ? { ...config[ key ], ...val }
            : val
          : val
      } ), {} )
} )