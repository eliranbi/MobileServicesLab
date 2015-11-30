/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global module, require, console, process*/

var fs = require('fs');

var _loggingEnabled = false;
var _loggingFileEnabled = false;

function _log(str, callback) {

  'use strict';

  if (_getLoggingEnabled()) {

    if (_getFileLoggingEnabled()) {

      fs.appendFile('analyticsSDK.log', new Date().toISOString() + '  ' + str + '\n', function (err) {
        if (err) {
          console.log('Error from appending to AnalyticsSDK log file: ' + err);
        }
        if (callback) {
          callback(err);
        }
      });

    } else {
      console.log(str);
      if (callback) {
        callback(null);
      }
    }

  } else {
    if (callback) {
      callback(new Error('Logging is not enabled'));
    }
  }
}

function _logEnter(str, callback) {
  'use strict';
  _log('ENTER ' + str, callback);
}

function _logExit(str, callback) {
  'use strict';
  _log('EXIT ' + str, callback);
}

function _setLoggingEnabled(flag) {
  'use strict';
  _loggingEnabled = flag;
}

function _getLoggingEnabled() {
  'use strict';
  return _loggingEnabled;
}

function _getFileLoggingEnabled() {
  'use strict';
  return _loggingFileEnabled;
}

function _setFileLoggingEnabled(flag) {
  'use strict';
  _loggingFileEnabled = flag;
}

_setFileLoggingEnabled(process.env.ANALYTICS_SDK_LOG === 'file');
_setLoggingEnabled(_getFileLoggingEnabled() || process.env.ANALYTICS_SDK_LOG === 'true');

module.exports = {
  log: _log,
  logEnter: _logEnter,
  logExit: _logExit,
  getLoggingEnabled: _getLoggingEnabled,
  setLoggingEnabled: _setLoggingEnabled,
  getFileLoggingEnabled: _getFileLoggingEnabled,
  setFileLoggingEnabled: _setFileLoggingEnabled
};