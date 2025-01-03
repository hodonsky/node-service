"use strict"

import Publisher from "./Publisher"
import Consumer from "./Consumer"

export { Consumer, Publisher };

export const compareServiceAction = ( left, right ) => {
  switch ( false ) {
    case left.version === right.version: throw "compareServiceAction: [version] mismatch.";
    case left.action === right.action: throw "compareServiceAction: [action] mismatch.";
    case left.method === right.method: throw "compareServiceAction: [method] mismatch.";
    case left.topic === right.topic: throw "compareServiceAction: [topic] mismatch.";
    case left.route === right.route: throw "compareServiceAction: [route] mismatch.";
    case left.requestTransformers === right.requestTransformers: throw "compareServiceAction: [requestTransformers] mismatch.";
    case left.responseTransformers === right.responseTransformers: throw "compareServiceAction: [responseTransformers] mismatch.";
    case left.requestAVRO === right.requestAVRO: throw "compareServiceAction: [requestAVRO] mismatch.";
    case left.responseAVRO === right.responseAVRO: throw "compareServiceAction: [responseAVRO] mismatch.";
    default: break;
  }
}