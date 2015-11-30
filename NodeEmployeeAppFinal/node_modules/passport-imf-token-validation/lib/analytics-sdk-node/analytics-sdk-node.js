/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global require, module, process, setInterval*/

var logger = require('./logger.js');
var utils = require('./utils.js');
var eventBufferFactory = require('./event-buffer-factory.js');
var CONSTANT = require('./constants.js');

var AnalyticsEventEmitter = require('./AnalyticsEventEmitter.js');

// PUBLIC FUNCTION init
module.exports = function init(serviceName, onErrorCallback) {

  'use strict';

  logger.logEnter("init with serviceName '" + serviceName + "'");

  // If analytics has been disabled, add dummy functions and quit.
  var isEnabled = process.env.ENABLE_ANALYTICS_SDK === 'no' ? false : true;
  if (!isEnabled) {
    var emptyEventEmitter = utils.getEmptyAnalyticsEventEmitter();
    logger.logExit('init, ENABLE_ANALYTICS_SDK is no');
    return emptyEventEmitter;
  }

  // Figure out which optional arguments were passed in.
  var optionalArguments = utils.getOptionalArguments(arguments, logger);
  
  //Build the AnalyticsEventEmitter
  var emitter = new AnalyticsEventEmitter(logger, utils, CONSTANT, onErrorCallback, optionalArguments, serviceName);

  var environment = utils.getEnvironment(emitter, optionalArguments.settings, logger);
  emitter.environment = environment;

  // Quit if the environment couldn't be created for some reason.
  if (!emitter.environment) {
    logger.logExit('init, createEnvironment returned null');
    return null;
  }

  emitter.setupEventBuffer(eventBufferFactory, serviceName, setInterval);

  logger.logExit('init');

  return emitter;
};
