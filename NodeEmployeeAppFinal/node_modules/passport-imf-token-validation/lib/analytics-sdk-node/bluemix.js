/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global process, module*/

// This module returns an "environment" object which encapsulates the request options needed to communicate with Analytics Repository.
function _setupBlueMixMode(emitter, settings, logger, utils, https, url) {

  'use strict';

  logger.logEnter('setupBlueMixMode');
  
  var runningInPublicEnv = utils.isRunningInPublicEnv ? utils.isRunningInPublicEnv(settings) : false;
    
  // Do some validation of the environment.
  if(runningInPublicEnv) {
    logger.log('SDK is running in user public environment.');
    
    if(!settings) {
      emitter.emit('error', 'SDK authorization settings are required when running in user org.');
      return null;
    } else if(typeof settings.AZFilterAppId !== 'string' || settings.AZFilterAppId.length < 1) {
      emitter.emit('error', 'Missing required setting: AZFilterAppId');
      return null;
    } else if(typeof settings.AZServerUrl !== 'string' || settings.AZServerUrl.length < 1) {
      emitter.emit('error', 'Missing required setting: AZServerUrl');
      return null;
    } else if(typeof settings.AZTokenProvider !== 'function') {
      emitter.emit('error', 'Missing required setting: AZTokenProvider');
      return null;
    }
    
    var azUrl = url.parse(settings.AZServerUrl);
    var azHostName = azUrl.hostname;
    
    if(!azHostName) {
      emitter.emit('error', 'AZServerUrl is not set to a valid URL: ' + settings.AZServerUrl);
      return null;
    }
    
    var domain,
    
    dotIndex = azHostName.indexOf('.');
    
    if (dotIndex > 0) {
      domain = azHostName.substring(dotIndex+1);
    }

    if(typeof domain !== 'string' || domain.length < 1) {
      emitter.emit('error', 'Unable to extract domain from AZServerUrl: ' + settings.AZServerUrl);
      return null;
    }
    
    // Host of Analytics Proxy using domain from AZ server.
    var proxyUrl = 'https://imfmobileanalytics.' + domain;
    
    if (process.env.ANALYTICS_PROXY_URL_OVERRIDE) {
      proxyUrl = process.env.ANALYTICS_PROXY_URL_OVERRIDE;
    }
    
    url = url.parse(proxyUrl);
    logger.log('Using analytics proxy hostname: ' + url.hostname);
    
    // Get an initial access token
    var proxyAccessToken;
    settings.AZTokenProvider().then(function(token) {
        proxyAccessToken = token;
        logger.log('Initial proxy access token: ' + proxyAccessToken);
	}, function(err) {
		logger.log(err);
		emitter.emit('error', 'Unable to get initial access token from AZTokenProvider');
                return null;
	});

  } else {
    logger.log('SDK is running in IMF organization.');
    
    if (!process.env.VCAP_SERVICES || process.env.VCAP_SERVICES === 'null') {
      emitter.emit('error', 'VCAP_SERVICES is not defined.');
      return null;
    }
    
    var esCredentials, // Used when SDK is running in elasticsearch mode.
    esIndexNamePathPrefix, // prefixed to all elasticsearch requests, b/c they must take place in the context of an index.
    esIndexName, // name of the elasticsearch index extracted from the credentials url.
    vcapServices = JSON.parse(process.env.VCAP_SERVICES);

    // Cycle through all bound services and look for elasticsearch.
    for (var key in vcapServices) {
      if (vcapServices.hasOwnProperty(key)) {
  
        var fullInfo;
  
        if (key.indexOf('AESearch') === 0) {
  
          // If we are bound to the analytics elasticsearch service,
          // the SDK will be running in elasticsearch mode.
          logger.log('Bound to Analytics Elasticsearch service.  SDK will use Elasticsearch.');
  
          fullInfo = vcapServices[key][0];
  
          if (fullInfo.credentials) {
            esCredentials = fullInfo.credentials;
          }
        }
      }
    }
  
    if (esCredentials) {
  
      url = url.parse(esCredentials.url);
      esIndexNamePathPrefix = url.path;
      esIndexName = url.path.substring(url.path.lastIndexOf('/') + 1);
  
    } else {
      // Not in elasticsearch mode, so we are required to have elasticsearch credentials.
      emitter.emit('error', 'No AESearch service credentials were found in VCAP_SERVICES: ' + process.env.VCAP_SERVICES);
      return null;
    }
  }
  
  logger.logExit('setupBlueMixMode');

  // Create the environment object.
  return {

    get: https.get,

    request: https.request,

    loadEventTypes: function loadEventTypes(callback, failureCallback) {

      // load event types directly from elasticsearch.
      var hostForEventTypesRequest = url.hostname;

      if (process.env.TESTONLY_ES_HOSTNAME_OVERRIDE) {
        // Only used by test code to simulate failures when loading the event types.
        hostForEventTypesRequest = process.env.TESTONLY_ES_HOSTNAME_OVERRIDE;
        logger.log('loadEventTypes overriding mappings url.  host override: ' + hostForEventTypesRequest);
      }

      var options;
      
      if(runningInPublicEnv) {
        options = {
            path: '/imfmobileanalytics/proxy/v1/eventtypes',
            hostname: hostForEventTypesRequest,
            port: url.port,
            headers: {
              'Authorization': proxyAccessToken
            }
          };
      } else {
        options = {
            path: esIndexNamePathPrefix + '/_mapping',
            hostname: hostForEventTypesRequest,
            port: url.port,
            auth: esCredentials.userid + ':' + esCredentials.password
          };
      }

      logger.log('loadEventTypes options: ' + JSON.stringify(options));

      var respCallback = function (json) {

        var eventTypes;

        try {
          eventTypes = JSON.parse(json);
        } catch (e) {
          emitter.emit('error', 'Error parsing GET event types response: ' + e);
          return;
        }

        if(!runningInPublicEnv) {
          // Extract mappings from ES respond that contains attributes for the <index_name>.mappings
          var mappingsForIndex = eventTypes[esIndexName];
  
          if (mappingsForIndex && mappingsForIndex.mappings) {
            eventTypes = mappingsForIndex.mappings;
          } else {
            emitter.emit('error', 'GET event types response does not contain mappings for index: ' + esIndexName);
            return;
          }
        } else {
          logger.log('loadEventTypes: Using eventTypes returned from proxy.');
        }

        callback(eventTypes);
      };

      var respConsumerCallback = utils.responseConsumer(logger, 'getting event types', 200, failureCallback ? failureCallback : emitter, respCallback);

      var request = https.get(options, respConsumerCallback);

      request.on('error', function (e) {
        emitter.emit('error', 'Error getting event types: ' + e);
        if (failureCallback) {
          failureCallback();
        }
      });
    },

    elasticsearchOptions: function elasticsearchOptions(method, path) {

      var options;
      
      if(runningInPublicEnv) {
        options = {
            method: method,
            path: path,
            hostname: url.hostname,
            port: url.port,
            headers: {
              'Authorization': proxyAccessToken
            }
          };   
      } else {
        options = {
            method: method,
            path: esIndexNamePathPrefix + path,
            hostname: url.hostname,
            port: url.port,
            auth: esCredentials.userid + ':' + esCredentials.password
          };        
      }

      logger.log('elasticsearchOptions: ' + JSON.stringify(options));

      return options;
    },
    
    // After invoking this function, one must invoke elasticsearchOptions again in order for new access token to be used.
    refreshProxyAccessToken: function refreshProxyAccessToken() {
        settings.AZTokenProvider().then(function(token) {
            proxyAccessToken = token;
            logger.log('Refreshed proxy access token: ' + proxyAccessToken);
        }, function(err) {
            logger.log(err);
            emitter.emit('error', 'Unable to refresh access token from AZTokenProvider');
            return null;
       });
    }
  };
}

module.exports = {
  setupBlueMixMode: _setupBlueMixMode,
};
