/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global exports, console*/

// Performs setup for running in local mode, and returns an environment object
// for tasks specific to local mode.
//
// Every incoming request is logged to the console.  Most responses are logged
// too.
//
// This is in its own module so it doesn't add overhead when we're running in
// BlueMix.  It requires the express and body-parser modules.
exports.setupLocalMode = function setupLocalMode(emitter, http, express, bodyParser) {

  'use strict';

  // Run with a local server and use HTTP.
  // Create a server listening on a port that's not already in use.
  var app = express(),
    server = http.createServer(app),
    port = 0;

  // Add middleware for parsing the JSON body of usage data events.
  app.use(bodyParser.json());

  // Add middleware that logs every incoming request.
  app.use(function (request, response, next) {
    console.log('{"request": "%s"}', request.path);
    next();
  });

  var eventRouteHandler = function (request, response) {
    // Collect the data and parse each line into an object.
    var payload = '';
    request.on('data', function (chunk) {
      payload += chunk;
    });
    request.on('end',
      function () {
        var body = payload.split('\n');
        if (body[body.length - 1].trim().length === 0) {
          // If there's an empty string at the end, remove it.
          body.pop();
        }
        if (body.length === 1) {
          body = JSON.parse(body[0]);
        } else {
          body = body.map(JSON.parse);
        }
        if (request.query.bulk || request.params.typeName === '_bulk' || request.path.indexOf('_bulk') !== -1) {
          // More than one event may have been sent.
          var events = {
            bulk: true,
            body: body
          };
          console.log(JSON.stringify(events));
        } else {
          // One event was sent.
          var event = {
            bulk: false,
            body: body
          };
          console.log(JSON.stringify(event));
        }

        response.status(200).send({});
      });
  };

  // Pretend to be Elasticsearch, listening for events.
  app.post('/FakeElasticSearch/v1/events/:typeName', eventRouteHandler);

  // Pretend to be Elasticsearch, listening for events.
  app.post('/FakeElasticSearch/v1/events/:typeName/_bulk', eventRouteHandler);

  server.on('listening', function serverReady() {
    port = server.address().port;
    emitter.emit('ready');
  });

  server.on('error', function (e) {
    emitter.emit('error', e);
  });

  emitter.startServer = function startServer() {
    server.listen();
  };
  emitter.stopServer = function stopServer() {
    server.close();
  };

  function localElasticSearchOptions(method, path) {

    return {
      method: method,
      path: '/FakeElasticSearch/v1/events' + path,
      hostname: 'localhost',
      port: port
    };
  }

  function loadEventTypes(callback) {
    // These are the event types used by the tests.
    var eventTypes = {
      Bob: {
        properties: {
          timestamp: {
            type: 'date'
          },
          a: {
            type: 'integer'
          },
          b: {
            index: 'not_analyzed',
            type: 'string'
          }
        }
      },
      ObjectCreate: {
        properties: {
          timestamp: {
            type: 'date'
          },
          appID: {
            index: 'not_analyzed',
            type: 'string'
          },
          database: {
            index: 'not_analyzed',
            type: 'string'
          },
          object: {
            index: 'not_analyzed',
            type: 'string'
          }
        }
      },
      FileTotal: {
        properties: {
          timestamp: {
            type: 'date'
          },
          appID: {
            index: 'not_analyzed',
            type: 'string'
          },
          size: {
            type: 'integer'
          },
          fileCount: {
            type: 'integer'
          }
        }
      },
      FileQuery: {
        properties: {
          timestamp: {
            type: 'date'
          },
          appID: {
            index: 'not_analyzed',
            type: 'string'
          },
          collection: {
            index: 'not_analyzed',
            type: 'string'
          },
          file: {
            index: 'not_analyzed',
            type: 'string'
          }
        }
      },
      FruitEvent: {
        properties: {
          timestamp: {
            type: 'date'
          },
          fruit: {
            index: 'not_analyzed',
            type: 'string'
          },
          amount: {
            type: 'integer'
          }
        }
      },
      SaladEvent: {
        properties: {
          timestamp: {
            type: 'date'
          },
          variety: {
            index: 'not_analyzed',
            type: 'string'
          },
          amount: {
            type: 'float'
          }
        }
      },
      InjuryEvent: {
        properties: {
          timestamp: {
            type: 'date'
          },
          location: {
            index: 'not_analyzed',
            type: 'string'
          },
          damage: {
            index: 'not_analyzed',
            type: 'string'
          }
        }
      },
      SportingEvent: {
        properties: {
          timestamp: {
            type: 'date'
          },
          sport: {
            index: 'not_analyzed',
            type: 'string'
          },
          leader: {
            index: 'not_analyzed',
            type: 'string'
          },
          players: {
            type: 'object'
          }
        }
      },
      Lou: {
        properties: {
          timestamp: {
            type: 'date'
          },
          aa: {
            index: 'not_analyzed',
            type: 'string'
          }
        }
      },
      Blah: {
        properties: {
          timestamp: {
            type: 'date'
          },
          aaa: {
            type: 'boolean'
          },
          bbb: {
            type: 'boolean'
          }
        }
      }
    };
    callback(eventTypes);
  }

  return {
    get: http.get,
    loadEventTypes: loadEventTypes,
    elasticsearchOptions: localElasticSearchOptions,
    request: http.request
  };

};