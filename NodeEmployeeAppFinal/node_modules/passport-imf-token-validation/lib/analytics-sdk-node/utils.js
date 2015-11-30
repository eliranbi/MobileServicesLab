/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module, require, process*/

//Returns a current timestamp unix-style
function _makeUnixCurrentTimestamp() {
  'use strict';
  return (new Date()).getTime();
}

// Returns a function that will consume a response, check for the proper
// status code(s), and report errors.  The success function and the second
// acceptable status code are optional.  If the status code is correct and
// there's a success function, it will be called with the response's body
// passed in.  The failure argument can either be an EventEmitter (to emit an
// error event on) or a callback function.  If the failure argument is a callback
// function, it will be invoked with the response and an error message.
function _responseConsumer(logger, description, okCode1, failure, success, okCode2) {

  'use strict';

  return function consume(response) {
    response.setEncoding('utf8');
    var body = '';
    response.on('data', function (chunk) {
      body += chunk;
    });
    response.on('end', function () {

      logger.log('response consumer (' + description + ') got code ' + response.statusCode + ' and body:\n' + body);

      // Check for errors.
      if (response.statusCode !== okCode1 && response.statusCode !== okCode2) {
        var message = 'Got statusCode ' + response.statusCode + ' ' + description + '.' + '\n' + body;

        if (typeof failure === 'object' && typeof failure.emit === 'function') {
          failure.emit('error', message);
        } else {
          failure(response, message);
        }
      } else if (success) {
        success(body);
      }
    });
  };
}

function _getOptionalArguments(args, logger) {

  'use strict';

  var output = {};

  if (args.length > 2) {
    output.settings = args[2];

    logger.log('A settings object was passed in.');
    logger.log('   localMode ' + output.settings.localMode);
    logger.log('   appCleanupInterval ' + output.settings.appCleanupInterval);
    logger.log('   reportEventInterval ' + output.settings.reportEventInterval);
    logger.log('   AZFilterAppId ' + output.settings.AZFilterAppId);
    logger.log('   AZServerUrl ' + output.settings.AZServerUrl);
    logger.log('   AZTokenProvider ' + output.settings.AZTokenProvider); 
  }

  var reportEventDelay = 2500;
  if (output.settings && output.settings.reportEventInterval) {
    reportEventDelay = output.settings.reportEventInterval;
  }
  logger.log('Using reportEventDelay ' + reportEventDelay);
  output.reportEventInterval = reportEventDelay;

  return output;
}

function _validateAnalyticNetworkContextObject(CONSTANT, context) {

  'use strict';

  var msg = '',
    isValid = true;

  if (typeof context !== 'object' || Array.isArray(context)) {
    isValid = false;
    var type = Array.isArray(context) ? "array" : typeof context;
    msg = 'The type of the context object must be object, it was: ' + type;

  } else if (context[CONSTANT.globalTrackingId] &&
    (typeof context[CONSTANT.globalTrackingId] !== 'string' || context[CONSTANT.globalTrackingId].length < 1)) {
    isValid = false;
    msg = 'Missing global tracking id non-zero length string, context.' + [CONSTANT.globalTrackingId] + ' passed was: ' +
      context[CONSTANT.globalTrackingId];

  } else if (typeof context[CONSTANT.inboundRequestURL] !== 'string' || context[CONSTANT.inboundRequestURL].length < 1) {
    isValid = false;
    msg = 'Missing inbound request URL non-zero length string, context.' + CONSTANT.inboundRequestURL + ' passed was: ' +
      context[CONSTANT.inboundRequestURL];

  } else if (typeof context[CONSTANT.outboundRequestURL] !== 'object' &&
    typeof context[CONSTANT.outboundRequestURL] !== 'string') {
    isValid = false;
    msg = 'Missing outbound request URL non-zero length string, context.' + CONSTANT.outboundRequestURL + ' passed was: ' +
      context[CONSTANT.outboundRequestURL];

  } else if (typeof context[CONSTANT.inboundTimestamp] !== 'object' &&
    typeof context[CONSTANT.inboundTimestamp] !== 'number') {
    isValid = false;
    msg = 'Missing inbound timestamp, context.' + CONSTANT.inboundTimestamp + ' passed was: ' +
      context[CONSTANT.inboundTimestamp];

  } else if (typeof context[CONSTANT.outboundBackendTimestamp] !== 'object' &&
    typeof context[CONSTANT.outboundBackendTimestamp] !== 'number') {
    isValid = false;
    msg = 'Missing outbound backend timestamp, context.' + CONSTANT.outboundBackendTimestamp + ' passed was: ' +
      context[CONSTANT.outboundBackendTimestamp];

  } else if (typeof context[CONSTANT.inboundBackendTimestamp] !== 'object' &&
    typeof context[CONSTANT.inboundBackendTimestamp] !== 'number') {
    isValid = false;
    msg = 'Missing inbound backend timestamp, context.' + CONSTANT.inboundBackendTimestamp + ' passed was: ' +
      context[CONSTANT.inboundBackendTimestamp];

  } else if (typeof context[CONSTANT.outboundTimestamp] !== 'object' &&
    typeof context[CONSTANT.outboundTimestamp] !== 'number') {
    isValid = false;
    msg = 'Missing outbound timestamp, context.' + CONSTANT.outboundTimestamp + ' passed was: ' +
      context[CONSTANT.outboundTimestamp];
  }

  return {
    isValid: isValid,
    msg: msg
  };
}

function _throwErrorWhenValidationFails(validator, args, ctx) {
  'use strict';

  var result = validator.apply(ctx, args);
  if (!result.isValid) {
    throw new Error(result.msg);
  }
}

function _getEnvironment(emitterObj, settings, logger) {

  'use strict';

  var emitter = emitterObj;

  // See if we're in local mode or not, get an environment object that
  // knows how to operate in this mode, and do mode-specific setup.
  // Environment objects have get and request functions, which map to the
  // similarly-named functions from the http or https module, and functions
  // that return an options object to use when calling get or request.  Those
  // functions are named elasticsearchOptions and so on.
  //
  // If there's a problem then this function returns null and an error is
  // emitted.

  var environment = null;

  if (settings && settings.localMode) {
    var http = require('http'),
      express = require('express'),
      bodyParser = require('body-parser');

    environment = require('./local-mode.js').setupLocalMode(emitter, http, express, bodyParser);

  } else {

    // Performs setup for running in BlueMix, and returns an environment object for
    // tasks specific to BlueMix.  Emits an error and returns null if we can't get
    // the information we need from VCAP_SERVICES environment variables or optional
    // arguments/settings passed into SDK init.
    var https = require('https'),
      url = require('url');

    /*jshint validthis:true */
    environment = require('./bluemix.js').setupBlueMixMode(emitter, settings, logger, this, https, url);
  }

  return environment;
}

//Answer if this is being run inside a user's public org/enviornment.
function _isRunningInPublicEnv(settings) {
	'use strict';

  if(settings && settings.localMode) {
    return false;
  }

  var isUserOrg = true;
	
	// this is a public environment if
	// - there IS NOT a VCAP_SERVICES
	// - OR there IS a VCAP_SERVICES and it DOES NOT contain an AESearch value
	if (!process.env.VCAP_SERVICES) {
		isUserOrg = true;
	} else if (process.env.VCAP_SERVICES.indexOf('AESearch') !== -1) {
		isUserOrg = false;
	}
	
	return isUserOrg;
}

function _getEmptyAnalyticsEventEmitter() {

  'use strict';

  var EventEmitter = require('events').EventEmitter;

  var emptyEventEmitter = new EventEmitter();

  emptyEventEmitter.logger = {};
  emptyEventEmitter.utils = {};
  emptyEventEmitter.CONSTANT = {};
  emptyEventEmitter.settings = {};
  emptyEventEmitter.reportEventDelay = {};
  emptyEventEmitter.setupEventBuffer = {};
  emptyEventEmitter.reportEvent = function reportEvent() {};
  emptyEventEmitter.reportEvents = function reportEvents() {};
  emptyEventEmitter.runElasticsearchQuery = function runElasticsearchQuery() {};
  emptyEventEmitter.recordInboundNetworkRequest = function recordInboundNetworkRequest() {};
  emptyEventEmitter.recordOutboundNetworkRequest = function recordOutboundNetworkRequest() {};
  emptyEventEmitter.recordInboundNetworkResponse = function recordInboundNetworkResponse() {};
  emptyEventEmitter.recordOutboundNetworkResponse = function recordOutboundNetworkResponse() {};
  emptyEventEmitter.reportNetworkEvent = function reportNetworkEvent() {};

  return emptyEventEmitter;
}

module.exports = {
  makeUnixCurrentTimestamp: _makeUnixCurrentTimestamp,
  responseConsumer: _responseConsumer,
  getOptionalArguments: _getOptionalArguments,
  validateAnalyticNetworkContextObject: _validateAnalyticNetworkContextObject,
  throwErrorWhenValidationFails: _throwErrorWhenValidationFails,
  getEnvironment: _getEnvironment,
  getEmptyAnalyticsEventEmitter: _getEmptyAnalyticsEventEmitter,
  isRunningInPublicEnv: _isRunningInPublicEnv
};