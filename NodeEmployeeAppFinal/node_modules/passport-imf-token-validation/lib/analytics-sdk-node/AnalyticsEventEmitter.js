/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module, require, process*/

var EventEmitter = require('events').EventEmitter;
var util = require('util');

// This is the main class that gets returned by our SDK init method.  It contains several public functions intended to be
// consumed by users of the SDK.  Similar to AnalyticsSDK.java for our java SDK.  See README.md for detailed documentation.
function AnalyticsEventEmitter(logger, utils, CONSTANT, onErrorCallback, optionalArguments, serviceName) {
  'use strict';

  this.logger = logger || {};
  this.utils = utils || {};
  this.CONSTANT = CONSTANT || {};

  optionalArguments = optionalArguments || {};

  this.settings = optionalArguments.settings;
  this.reportEventDelay = optionalArguments.reportEventInterval;
  
  if(serviceName) {
    this.networkRequestServiceName = serviceName;
  }

  // Register onErrorCallback callback
  this.on('error', onErrorCallback || function (err) {
    this.logger.log('Emitted an error event: ' + err);
  });
}

util.inherits(AnalyticsEventEmitter, EventEmitter);

AnalyticsEventEmitter.prototype.setupEventBuffer = function setupEventBuffer(eventBufferFactory, serviceName, setIntervalFunction) {

  'use strict';

  var that = this;

  // This variable is used to validate events before we send them to Elasticsearch.
  // It will have a property for each of our event types.  The value of a
  // property is an array of the names of the event type's properties.
  //
  // {'type1': ['type1-prop1', 'type1-prop2'], 'type2': ['type2-prop1', 'type2-prop2'}
  var eventTypes = {};

  // Returns an event buffer, which stores events and periodically sends them
  // to Elasticsearch.  Use eventBuffer.addOne() or addMany() to put events in the buffer.
  var eventBuffer = eventBufferFactory.createEventBuffer(that.logger, that.utils, that.settings,
    that.reportEventDelay, that, that.environment, eventTypes, setIntervalFunction);

  that.eventBuffer = eventBuffer;

  // Get the event types from the analytics repository.
  var loadTypes_successCallback = function (types) {

    that.logger.logEnter('callback in loadEventTypes, types:\n' + JSON.stringify(types));

    // The "raw" event type data has a deeply-nested structure and it
    // contains a bunch of stuff we're not interested in.  We'll just
    // store the names of each type's properties.
    Object.keys(types).forEach(function (typeName) {
      if (types[typeName].properties) {
        eventTypes[typeName] = Object.keys(types[typeName].properties);
      }
    });

    that.logger.log('eventTypes:\n' + JSON.stringify(eventTypes));

    if (process.env.TESTONLY_EMIT_INTERNAL_EVENTS) {
      that.emit(that.CONSTANT.internal_event_load_types_done);
    }

    // Now the event buffer can begin processing events.
    eventBuffer.ready();

    that.logger.logExit('callback in loadEventTypes');
  };

  var load_attempt = 0;
  var loadTypes_failureCallback = function () {
    // We don't expect loadEventTypes to fail, but if it does we want to wait a few seconds and try again.
    // That way eventually the types will be loaded, the event buffer will go to ready state and SDK will
    // sending event to analytics repo without require App using the SDK to be restarted.
    that.logger.logEnter('failure callback for loadEventTypes. reschedule loading of event types.');

    that.emit('error', 'Error loading analytics event types.  load_attempt: ' + (load_attempt++));

    if (process.env.TESTONLY_EMIT_INTERNAL_EVENTS) {
      that.emit(that.CONSTANT.internal_event_load_types_error);
    }

    // Clear events that where in the buffer, so that the buffer doesn't continuously grow when ES
    // is down and the event types can't be initialized.
    var eventsLost = eventBuffer.clear();

    if (eventsLost > 0) {
      that.emit('error', 'Analytic events where lost because failure to load event types.  Lost events: ' + eventsLost);
    }

    // Wait a few seconds and attempt to reload the types.
    var timeout = setTimeout(function () {
      that.environment.loadEventTypes(loadTypes_successCallback, loadTypes_failureCallback);
    }, 2000);
    timeout.unref();

    that.logger.logExit('failure callback for loadEventTypes.');
  };

  that.environment.loadEventTypes(loadTypes_successCallback, loadTypes_failureCallback);
};

// PUBLIC FUNCTION reportEvent
AnalyticsEventEmitter.prototype.reportEvent = function reportEvent(eventType, eventObj) {

  'use strict';

  var that = this;

  that.logger.logEnter('reportEvent ' + eventType + ' ' + JSON.stringify(eventObj));

  try {
    eventObj.timestamp = that.utils.makeUnixCurrentTimestamp();
    that.eventBuffer.addOne(eventType, eventObj);
  } catch (thrown) {
    that.emit('error', 'While reporting an event, caught ' + thrown);
  }

  that.logger.logExit('reportEvent');
};

// PUBLIC FUNCTION reportEvents
AnalyticsEventEmitter.prototype.reportEvents = function reportEvents() {

  'use strict';

  var that = this;

  that.logger.logEnter('reportEvents');

  try {
    var timestamp = that.utils.makeUnixCurrentTimestamp();

    for (var i = 0; i < arguments.length; i += 2) {
      var eventType = arguments[i],
        events = arguments[i + 1];

      that.logger.log('  reportEvents has ' + eventType + ':\n  ' + JSON.stringify(events));

      for (var j = 0; j < events.length; j++) {
        events[j].timestamp = timestamp;
      }

      that.eventBuffer.addMany(eventType, events);
    }
  } catch (thrown) {
    that.emit('error', 'While reporting events, caught ' + thrown);
  }

  that.logger.logExit('reportEvents');
};

// PUBLIC FUNCTION runElasticsearchQuery
AnalyticsEventEmitter.prototype.runElasticsearchQuery = function runElasticsearchQuery(queryBody, eventTypes, callback) {

  'use strict';

  var that = this;

  that.logger.logEnter('runElasticsearchQuery');

  var runningInPublicEnv = that.utils.isRunningInPublicEnv ? that.utils.isRunningInPublicEnv(that.settings) : false;
        
  try {

    var searchTypeValue = arguments[3];
    var testOverrideOptions = arguments[4];
    
    that.logger.log('  queryBody: ' + JSON.stringify(queryBody) + ' eventTypes: ' +
      eventTypes + ' searchType: ' + searchTypeValue + ' testOverrideOptions: ' + testOverrideOptions);

    if(runningInPublicEnv && !testOverrideOptions) {
      that.emit('error', 'runElasticsearchQuery: Requires test overrides when running in public org.');
      return;
    }
    
    // POST the query, pass the result to the callback, report errors.
    var path = '/' + eventTypes + '/_search';

    if (searchTypeValue) {
      // type of elasticsearch query (e.g. count only).
      path += '?search_type=' + searchTypeValue;
    }

    var options = that.environment.elasticsearchOptions('POST', path);

    if(testOverrideOptions) {
      options = {
          method: 'POST',
          path: testOverrideOptions.test_override_query_indexName + path,
          hostname: testOverrideOptions.test_override_query_hostname,
          port: testOverrideOptions.test_override_query_port,
          auth: testOverrideOptions.test_override_query_userid + ':' + testOverrideOptions.test_override_query_password
        };   
      
      that.logger.log('Running ES query using test override options:');
      that.logger.log(options);
    }
    
    var responseConsumerCallback = function (json) {

      that.logger.log('result from query is ' + json);

      try {
        var reply = JSON.parse(json);
        callback(reply);
      } catch (e) {
        that.emit('error', 'Error parsing query result JSON: ' + e);
      }
    };

    var requestCallback = that.utils.responseConsumer(that.logger,
      'after posting elasticsearch query', 200, this, responseConsumerCallback);

    var request = that.environment.request(options, requestCallback);

    request.once('error', function (e) {
      that.emit('error', 'Error while posting query: ' + JSON.stringify(queryBody) + ': ' + e);
    });

    request.setHeader('Content-Type', 'application/json');
    request.end(JSON.stringify(queryBody));

  } catch (thrown) {
    that.emit('error', 'In runElasticsearchQuery, caught ' + thrown);
  }

  that.logger.logExit('runElasticsearchQuery');
};

// PUBLIC FUNCTION recordInboundNetworkRequest
AnalyticsEventEmitter.prototype.recordInboundNetworkRequest = function recordInboundNetworkRequest(context) {

  'use strict';

  var that = this;

  that.logger.logEnter('recordInboundNetworkRequest, context = ' + JSON.stringify(context));

  context = context || {};

  context[that.CONSTANT.outboundRequestURL] = null;

  context[that.CONSTANT.inboundTimestamp] = that.utils.makeUnixCurrentTimestamp();
  context[that.CONSTANT.outboundBackendTimestamp] = null;
  context[that.CONSTANT.inboundBackendTimestamp] = null;
  context[that.CONSTANT.outboundTimestamp] = null;

  that.utils.throwErrorWhenValidationFails(that.utils.validateAnalyticNetworkContextObject, [that.CONSTANT, context], that);

  that.logger.logExit('recordInboundNetworkRequest');
};

// PUBLIC FUNCTION recordOutboundNetworkRequest
AnalyticsEventEmitter.prototype.recordOutboundNetworkRequest = function recordOutboundNetworkRequest(context, url) {

  'use strict';

  var that = this;

  that.logger.logEnter('recordOutboundNetworkRequest, context = ' + JSON.stringify(context) + ', url = ' + url);

  that.utils.throwErrorWhenValidationFails(that.utils.validateAnalyticNetworkContextObject, [that.CONSTANT, context], that);

  if (typeof url !== 'string' || url.length < 1) {
    throw new Error('Missing outbound request URL non-zero string, url passed was: ' + url);
  }

  context[that.CONSTANT.outboundRequestURL] = url;

  context[that.CONSTANT.outboundBackendTimestamp] = that.utils.makeUnixCurrentTimestamp();

  that.logger.logExit('recordOutboundNetworkRequest');
};

// PUBLIC FUNCTION recordInboundNetworkResponse
AnalyticsEventEmitter.prototype.recordInboundNetworkResponse = function recordInboundNetworkResponse(context) {

  'use strict';

  var that = this;

  that.logger.logEnter('recordInboundNetworkResponse, context = ' + JSON.stringify(context));

  that.utils.throwErrorWhenValidationFails(that.utils.validateAnalyticNetworkContextObject, [that.CONSTANT, context], that);

  context[that.CONSTANT.inboundBackendTimestamp] = that.utils.makeUnixCurrentTimestamp();

  that.logger.logExit('recordInboundNetworkResponse');
};

// PUBLIC FUNCTION recordOutboundNetworkResponse
AnalyticsEventEmitter.prototype.recordOutboundNetworkResponse = function recordOutboundNetworkResponse(context) {

  'use strict';

  var that = this;

  that.logger.logEnter('recordOutboundNetworkResponse, context = ' + JSON.stringify(context));

  that.utils.throwErrorWhenValidationFails(that.utils.validateAnalyticNetworkContextObject, [that.CONSTANT, context], that);

  context[that.CONSTANT.outboundTimestamp] = that.utils.makeUnixCurrentTimestamp();

  that.logger.logExit('recordOutboundNetworkResponse');
};

// PUBLIC FUNCTION reportNetworkEvent
AnalyticsEventEmitter.prototype.reportNetworkEvent = function reportNetworkEvent(context) {

  'use strict';

  var that = this;

  that.logger.logEnter('reportNetworkEvent, context = ' + JSON.stringify(context));
  
  that.utils.throwErrorWhenValidationFails(that.utils.validateAnalyticNetworkContextObject, [that.CONSTANT, context], that);

  // throwErrorWhenValidationFails is used by the other network related APIs, however appId isn't required
  // until reportNetworkEvent is invoked.  So we do the validation of appId here.
  var appId = context[that.CONSTANT.appId];
  if (typeof appId !== 'string' || appId.length < 1) {
    throw new Error('The AnalyticNetworkContext parameter is missing required attribute: ' + that.CONSTANT.appId);
  }
  
  var eventObj = {};

  eventObj[that.CONSTANT.appId] = appId;
  eventObj[that.CONSTANT.globalTrackingId] = context[that.CONSTANT.globalTrackingId];
  eventObj[that.CONSTANT.inboundRequestURL] = context[that.CONSTANT.inboundRequestURL];
  eventObj[that.CONSTANT.inboundTimestamp] = context[that.CONSTANT.inboundTimestamp];
  eventObj[that.CONSTANT.outboundTimestamp] = context[that.CONSTANT.outboundTimestamp];

  if (typeof context[that.CONSTANT.outboundRequestURL] === 'string' &&
    context[that.CONSTANT.outboundRequestURL].length > 0) {
    eventObj[that.CONSTANT.outboundRequestURL] = context[that.CONSTANT.outboundRequestURL];
  }

  if (typeof context[that.CONSTANT.outboundBackendTimestamp] === 'number' &&
    context[that.CONSTANT.outboundBackendTimestamp].toString().length === 13) {
    eventObj[that.CONSTANT.requestProcessingTime] = context[that.CONSTANT.outboundBackendTimestamp] -
      context[that.CONSTANT.inboundTimestamp];
  }

  if (typeof context[that.CONSTANT.inboundBackendTimestamp] === 'number' &&
    context[that.CONSTANT.inboundBackendTimestamp].toString().length === 13) {
    eventObj[that.CONSTANT.responseProcessingTime] = context[that.CONSTANT.outboundTimestamp] -
      context[that.CONSTANT.inboundBackendTimestamp];
  }

  if (typeof context[that.CONSTANT.deviceId] === 'string' &&
     context[that.CONSTANT.deviceId].length > 0) {
     eventObj[that.CONSTANT.deviceId] = context[that.CONSTANT.deviceId];
  }
  
  if (typeof context[that.CONSTANT.deviceOS] === 'string' &&
     context[that.CONSTANT.deviceOS].length > 0) {
     eventObj[that.CONSTANT.deviceOS] = context[that.CONSTANT.deviceOS];
  }
  
  if (typeof context[that.CONSTANT.deviceOsVersion] === 'string' &&
     context[that.CONSTANT.deviceOsVersion].length > 0) {
     eventObj[that.CONSTANT.deviceOsVersion] = context[that.CONSTANT.deviceOsVersion];
  }
  
  if (typeof context[that.CONSTANT.deviceModel] === 'string' &&
     context[that.CONSTANT.deviceModel].length > 0) {
     eventObj[that.CONSTANT.deviceModel] = context[that.CONSTANT.deviceModel];
  }
  
  if (typeof context[that.CONSTANT.deviceAppName] === 'string' &&
     context[that.CONSTANT.deviceAppName].length > 0) {
     eventObj[that.CONSTANT.deviceAppName] = context[that.CONSTANT.deviceAppName];
  }
  
  if (typeof context[that.CONSTANT.deviceAppVersion] === 'string' &&
     context[that.CONSTANT.deviceAppVersion].length > 0) {
     eventObj[that.CONSTANT.deviceAppVersion] = context[that.CONSTANT.deviceAppVersion];
  }
  
  eventObj[that.CONSTANT.duration] = context[that.CONSTANT.outboundTimestamp] - context[that.CONSTANT.inboundTimestamp];

  if(that.networkRequestServiceName) {
    eventObj[that.CONSTANT.serviceName] = that.networkRequestServiceName;
  }
  
  process.nextTick(function () {
    that.reportEvent(that.CONSTANT.MobileServerNetworkTransactions, eventObj);
  });

  that.logger.logExit('reportNetworkEvent');
};

module.exports = AnalyticsEventEmitter;