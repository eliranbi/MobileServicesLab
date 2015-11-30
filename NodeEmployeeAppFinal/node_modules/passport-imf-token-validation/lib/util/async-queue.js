/**
 *  Copyright 2014 IBM Corp. All Rights Reserved
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.  
 */

var Q = require('q'),
    events = require('events'),  
    util = require('util'),
    ibmlogger = require('./security-logger');

function AsyncQueue() {
	this.queue = {};	
	this.on('resolve',this.resolveHandler);
}
util.inherits(AsyncQueue, events.EventEmitter); 

AsyncQueue.prototype.add = function(appid,payload) {
	var deferred = Q.defer();
	var d = {
			appid: appid,
			payload: payload,
			deferred: deferred
	};
	
	if (! this.queue[appid]) {
		this.queue[appid] = [];
	} 
	this.queue[appid].push(d);
	return deferred.promise;
}

AsyncQueue.prototype.resolveHandler = function(appid) {
	ibmlogger.getLogger().debug('release the queue for appid:',appid);
	
	if (this.queue[appid]) {
		this.queue[appid].forEach(function(d){
			ibmlogger.getLogger().debug('released',d);
			var payload = d.payload;
			var deferred = d.deferred;
			deferred.resolve(payload);
		});
		ibmlogger.getLogger().debug('clear the queue for appid:'+appid);
		this.queue[appid] = [];
	}

}

exports = module.exports = AsyncQueue;