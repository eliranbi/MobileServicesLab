/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module*/

// Starts a timer to process events being reported via the SDK.  Events are buffered and a timer periodically sends
// the events (in bulk) to the Analytics Repository.  The buffer must be placed in the "ready" state before events
// will be sent.  "ready" state is set once the event types have been loaded from the Analytics Repo.  The properties
// of reported events are validated before sending them to repo.
function _createEventBuffer(logger, utils, settings, reportEventDelay, emitter, environment, eventTypes, setIntervalFunction) {

  'use strict';

  logger.logEnter('createEventBuffer');

  // Each element of the buffer is an array containing an event type's
  // name, followed by events of that type.  The buffer's typeMap field
  // has a property for each event type's name, whose value is the index
  // where events of that type are stored.
  //
  // A buffer with two events of type A and one event of type B would look
  // like this:
  //
  //    buffer[0] = ['A', {event-object-1}, {event-object-2}]
  //    buffer[1] = ['B', {event-object-3}]
  //    buffer.typeMap.A = 0;
  //    buffer.typeMap.B = 1;
  var buffer = [],
    eventCount = 0,
    canDelaySend = true;

  buffer.typeMap = {};

  var runningInPublicEnv = utils.isRunningInPublicEnv ? utils.isRunningInPublicEnv(settings) : false;
      
  // This function will run every so often to send the buffered events to Elasticsearch.
  function sendEvents() {

    logger.logEnter('sendEvents with eventCount ' + eventCount);

    if (eventCount > 0) {

      // If there are fewer than 10 events, we wait for more to arrive
      // before sending them.  Only delay sending them once so they
      // don't get too old.
      if (eventCount < 10 && canDelaySend) {

        // Wait for more events.
        canDelaySend = false;

        logger.logExit('sendEvents, wait for more events');
        return;
      }

      // Post the events.
      canDelaySend = true;

      // Ensure they're valid.
      validate();

      if (eventCount === 0) {

        // All events were invalid.  We're done.
        logger.logExit('sendEvents, all events were invalid');
        return;
      }

      try {
        // Use one of the three APIs: there's one for a single
        // event, one for multiple events of the same type, and
        // one for a mix of types.
        var path,
          request,
          eventData,
          failureCallback,
          retryEventCount, retryEventData, retryBuffer;

        if (buffer.length === 1) {
          // They're all the same type.
          eventData = buffer[0];

          if(runningInPublicEnv) {
            path = '/imfmobileanalytics/proxy/v1/apps/' + settings.AZFilterAppId + '/' + eventData[0];
          } else {
            path = '/' + eventData[0];
          }

          if (eventCount > 1) {
            path += '/_bulk';
          }
                    
          if(runningInPublicEnv) {
            // Deal with expiration of access token by refreshing token and retry the request.
            retryEventCount = eventCount;
            retryEventData = eventData;
            
            failureCallback = function(failureResponse, failureMessage) {
              emitter.emit('error', failureMessage);
              
              if(failureResponse.statusCode === 401) {
                logger.log('Received 401 Unathorized response while posting event(s) of same type.  Refresh access token and retry the post.');
                
                environment.refreshProxyAccessToken();
                var retryRequest = createLogRequest(logger, utils, path, environment, emitter, null);
                
                if (retryEventCount > 1) {
                  for (var i = 1; i < retryEventData.length; i++) {
                    retryRequest.write('{"create":{}}\n');
                    retryRequest.write(JSON.stringify(retryEventData[i]) + '\n');
                  }
                  retryRequest.end();
                } else {
                  retryRequest.end(JSON.stringify(retryEventData[1]));
                }
              }
            };
          }
          
          request = createLogRequest(logger, utils, path, environment, emitter, failureCallback);

          // If this request processing logic is changed, then retryRequest processing above should also be changed.
          if (eventCount > 1) {
            for (var i = 1; i < eventData.length; i++) {
              request.write('{"create":{}}\n');
              request.write(JSON.stringify(eventData[i]) + '\n');
            }
            request.end();
          } else {
            request.end(JSON.stringify(eventData[1]));
          }

        } else {

          // There's more than one type of event.
          if(runningInPublicEnv) {
            path = '/imfmobileanalytics/proxy/v1/apps/' + settings.AZFilterAppId + '/_bulk';
          } else {
            path = '/_bulk';
          }
          
          if(runningInPublicEnv) {
            // Deal with expiration of access token by refreshing token and retry the request.
            retryBuffer = buffer.slice(0);
            
            failureCallback = function(failureResponse, failureMessage) {
              emitter.emit('error', failureMessage);
              
              if(failureResponse.statusCode === 401) {
                logger.log('Received 401 Unathorized response while posting event(s) of different types.  Refresh access token and retry the post.');
                
                environment.refreshProxyAccessToken();
                var retryRequest = createLogRequest(logger, utils, path, environment, emitter, null);
                
                for (var x = 0; x < retryBuffer.length; x++) {
                  retryEventData = retryBuffer[x];
                  var createObject = '{"create":{"_type":"' + retryEventData[0] + '"}}\n';
                  for (var j = 1; j < retryEventData.length; j++) {
                    retryRequest.write(createObject);
                    retryRequest.write(JSON.stringify(retryEventData[j]) + '\n');
                  }
                }

                retryRequest.end();
              }
            };
          }
          
          request = createLogRequest(logger, utils, path, environment, emitter, failureCallback);

          // If this request processing logic is changed, then retryRequest processing above should also be changed.
          for (var x = 0; x < buffer.length; x++) {
            eventData = buffer[x];
            var createObject = '{"create":{"_type":"' + eventData[0] + '"}}\n';
            for (var j = 1; j < eventData.length; j++) {
              request.write(createObject);
              request.write(JSON.stringify(eventData[j]) + '\n');
            }
          }

          request.end();
        }
      } catch (thrown) {
        emitter.emit('error', 'While reporting events, caught ' + thrown);
      }

      buffer.clear();
    }

    logger.logExit('sendEvents');
  }

  // This is called once we get the list of event types.
  buffer.ready = function ready() {

    logger.logEnter('buffer.ready');

    // setIntervalFunction is passed in as an argument to assist with testing this code path.
    var interval = setIntervalFunction(sendEvents, reportEventDelay);
    interval.unref();

    logger.logExit('buffer.ready');
  };

  // Adds one event to the buffer.
  buffer.addOne = function addOne(eventType, event) {

    logger.logEnter('buffer.addOne ' + eventType);

    eventCount++;

    var index = buffer.typeMap[eventType];
    if (index === undefined) {
      buffer.typeMap[eventType] = buffer.length;
      buffer.push([eventType, event]);
    } else {
      buffer[index].push(event);
    }

    logger.logExit('buffer.addOne, typeMap is now ' + JSON.stringify(buffer.typeMap));
  };

  // Adds multiple events to the buffer, all of the same type.
  buffer.addMany = function addMany(eventType, events) {

    logger.logEnter('buffer.addMany');

    eventCount += events.length;

    var index = buffer.typeMap[eventType];
    if (index === undefined) {
      buffer.typeMap[eventType] = buffer.length;
      events.unshift(eventType);
      buffer.push(events);
    } else {
      buffer[index] = buffer[index].concat(events);
    }

    logger.logExit('buffer.addMany, typeMap is now ' + JSON.stringify(buffer.typeMap));
  };

  // Removes everything from the buffer.
  buffer.clear = function clear() {

    logger.logEnter('buffer.clear');

    var inBufferBeforeClear = eventCount;

    eventCount = 0;
    buffer.length = 0;
    buffer.typeMap = {};

    logger.logExit('buffer.clear');

    return inBufferBeforeClear;
  };

  // Verifies that every event's type exists and it has the proper
  // fields.  Any invalid events are not sent to Elasticsearch, and an
  // error is emitted for each.
  function validate() {

    logger.logEnter('validate');

    for (var i = 0; i < buffer.length; i++) {

      var eventData = buffer[i],
        typeName = eventData[0],
        typeKeys = eventTypes[typeName];

      if (!typeKeys) {

        emitter.emit('error', typeName + ' is not a known event type.');

        // Remove these events.
        eventCount -= eventData.length - 1;
        buffer.splice(i, 1);
        i--;

      } else {

        for (var j = 1; j < eventData.length; j++) {

          if (!validEvent(Object.keys(eventData[j]), typeKeys, emitter, typeName)) {

            // Remove this event.
            eventCount--;
            if (eventData.length === 2) {
              buffer.splice(i, 1);
              i--;
              break;
            } else {
              eventData.splice(j, 1);
              j--;
            }
          }
        }
      }
    }

    logger.logExit('validate');
  }

  // Returns true if every element of eventKeys is in typeKeys.
  function validEvent(eventKeys, typeKeys, emitter, typeName) {

    if (eventKeys.length > typeKeys.length) {
      emitter.emit('error', 'An event has more properties than its type, ' + typeName +
        '. Event properties: [' + eventKeys + ']. ' + typeName + ' properties: [' + typeKeys + '].');
      return false;
    } else {

      for (var i = 0; i < eventKeys.length; i++) {
        if (typeKeys.indexOf(eventKeys[i]) === -1) {
          emitter.emit('error', 'An event has property "' + eventKeys[i] + '" which is not in its type, ' + typeName +
            '. Event properties: [' + eventKeys + ']. ' + typeName + ' properties: [' + typeKeys + '].');
          return false;
        }
      }
      return true;
    }
  }

  logger.logExit('createEventBuffer');

  return buffer;
}

// Creates and initializes a request object for POSTing to Elasticsearch.
function createLogRequest(logger, utils, path, environment, emitter, failureCallback) {

  'use strict';

  logger.logEnter('createLogRequest ' + path);

  var options = environment.elasticsearchOptions('POST', path);

  var respConsumer = utils.responseConsumer(logger, 'after posting events', 200, failureCallback ? failureCallback : emitter, null, 201, options, path);

  var request = environment.request(options, respConsumer);

  request.once('error', function (e) {
    emitter.emit('error', 'Error while reporting events: ' + e);
  });

  request.setHeader('Content-Type', 'text/plain');

  logger.logExit('createLogRequest');

  return request;
}

module.exports = {
  createEventBuffer: _createEventBuffer
};