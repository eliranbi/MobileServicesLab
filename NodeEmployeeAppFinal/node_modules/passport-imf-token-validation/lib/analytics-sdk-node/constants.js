/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module*/

// NOTE: If you add any new constants you also need to update the analytics-sdk-node/test/unit/constants.spec.js unit test.
module.exports = {
  MobileServerNetworkTransactions: 'MobileServerNetworkTransactions',

  globalTrackingId: 'globalTrackingId',
  inboundRequestURL: 'inboundRequestURL',
  inboundTimestamp: 'inboundTimestamp',
  outboundTimestamp: 'outboundTimestamp',
  outboundRequestURL: 'outboundRequestURL',
  outboundBackendTimestamp: 'outboundBackendTimestamp',
  requestProcessingTime: 'requestProcessingTime',
  inboundBackendTimestamp: 'inboundBackendTimestamp',
  responseProcessingTime: 'responseProcessingTime',
  duration: 'duration',
  serviceName: 'serviceName',

  appId: 'appId',
  deviceId: 'deviceId',
  deviceOS: 'deviceOS',
  deviceOsVersion: 'deviceOSVersion',
  deviceModel: 'deviceModel',
  deviceAppName: 'deviceAppName',
  deviceAppVersion: 'deviceAppVersion',
  
  iss: 'iss',
  sub: 'sub',
  aud: 'aud',
  exp: 'exp',
  iat: 'iat',
  userId: 'userId',
  userAuthBy: 'userAuthBy',
  userDisplayName: 'userDisplayName',
  userAttributesRole: 'userAttributesRole',
  devicePlatform: 'devicePlatform',
  appVersionNumber: 'appVersionNumber',
  
  tokenIss: 'iss',
  tokenSub: 'sub',
  tokenAud: 'aud',
  tokenExp: 'exp',
  tokenIat: 'iat',
  tokenImfUser: 'imf.user',
  tokenUserId: 'id',
  tokenUserAuthBy: 'authBy',
  tokenUserDisplayName: 'displayName',
  tokenUserAttributes: 'attributes',
  tokenUserAttributesRole: 'role',
  tokenImfDevice: 'imf.device',
  tokenDeviceId: 'id',
  tokenDevicePlatform: 'platform',
  tokenDeviceOsVersion: 'osVersion',
  tokenDeviceModel: 'model',
  tokenImfApplication: 'imf.application',
  tokenImfApplicationId: 'id',
  tokenImfApplicationVersion: 'version',

  // Internal events which are emitted from SDK if process.env.TESTONLY_EMIT_INTERNAL_EVENTS is set.
  internal_event_load_types_done: 'load_types_done',
  internal_event_load_types_error: 'load_types_error'

};