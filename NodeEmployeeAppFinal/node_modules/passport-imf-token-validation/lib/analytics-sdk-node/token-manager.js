/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module, require*/

var CONSTANT = require('./constants.js');

function TokenManager(
  iss,
  sub,
  aud,
  exp,
  iat,
  userid,
  authby,
  displayname,
  role,
  deviceid,
  platform,
  os,
  model,
  appid,
  appver
) {

  'use strict';

  this[CONSTANT.iss] = iss;
  this[CONSTANT.sub] = sub;
  this[CONSTANT.aud] = aud;
  this[CONSTANT.exp] = exp;
  this[CONSTANT.iat] = iat;
  this[CONSTANT.userId] = userid;
  this[CONSTANT.userAuthBy] = authby;
  this[CONSTANT.userDisplayName] = displayname;
  this[CONSTANT.userAttributesRole] = role;
  this[CONSTANT.deviceId] = deviceid;
  this[CONSTANT.devicePlatform] = platform;
  this[CONSTANT.deviceOsVersion] = os;
  this[CONSTANT.deviceModel] = model;
  this[CONSTANT.appId] = appid;
  this[CONSTANT.appVersionNumber] = appver;
}

function buildTokenManager(token) {
  'use strict';

  var t = null;

  try {

    if (typeof token !== 'object' || Array.isArray(token)) {
      throw new Error('Token must be an object');
    }

    var userid = null,
      authby = null,
      displayName = null,
      role = null,
      deviceid = null,
      devicePlatform = null,
      deviceOsVersion = null,
      deviceModel = null,
      appId = null,
      appVersionNumber = null;

    if (token[CONSTANT.tokenImfUser]) {
      userid = token[CONSTANT.tokenImfUser][CONSTANT.tokenUserId];
      authby = token[CONSTANT.tokenImfUser][CONSTANT.tokenUserAuthBy];
      displayName = token[CONSTANT.tokenImfUser][CONSTANT.tokenUserDisplayName];

      if (token[CONSTANT.tokenImfUser][CONSTANT.tokenUserAttributes]) {
        role = token[CONSTANT.tokenImfUser][CONSTANT.tokenUserAttributes][CONSTANT.tokenUserAttributesRole];
      }
    }

    if (token[CONSTANT.tokenImfDevice]) {
      deviceid = token[CONSTANT.tokenImfDevice][CONSTANT.tokenDeviceId];
      devicePlatform = token[CONSTANT.tokenImfDevice][CONSTANT.tokenDevicePlatform];
      deviceOsVersion = token[CONSTANT.tokenImfDevice][CONSTANT.tokenDeviceOsVersion];
      deviceModel = token[CONSTANT.tokenImfDevice][CONSTANT.tokenDeviceModel];
    }

    if (token[CONSTANT.tokenImfApplication]) {
      appId = token[CONSTANT.tokenImfApplication][CONSTANT.tokenImfApplicationId];
      appVersionNumber = token[CONSTANT.tokenImfApplication][CONSTANT.tokenImfApplicationVersion];
    }

    t = new TokenManager(
      token[CONSTANT.tokenIss] || null,
      token[CONSTANT.tokenSub] || null,
      token[CONSTANT.tokenAud] || null,
      token[CONSTANT.tokenExp] || null,
      token[CONSTANT.tokenIat] || null,
      userid,
      authby,
      displayName,
      role,
      deviceid,
      devicePlatform,
      deviceOsVersion,
      deviceModel,
      appId,
      appVersionNumber
    );

  } catch (e) {
    throw new Error('Unable to handle token. ' + e.toString() + '. Token = ' + JSON.stringify(token));
  }

  return t;
}

module.exports = {
  buildTokenManager: buildTokenManager,
  TokenManager: TokenManager
};