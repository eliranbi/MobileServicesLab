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

var passport = require('passport');
var util = require('util');

function Authenticator() {}

Authenticator.prototype.use = function(name, strategy) {
	return passport.use(name,strategy);
}

Authenticator.prototype.unuse = function(name) {
	return passport.unuse(name);
};

Authenticator.prototype.initialize = function(options) {
	return passport.initialize(options);
}

Authenticator.prototype.authenticate = function(strategy, options, callback) {

	var func = passport.authenticate(strategy,options,callback);
	return function(req,res,next) {

		var resHolder = {
				statusCode: 204,
				redirect: function(url) {
					res.redirect(url)
				},
				setHeader: function(key,value) {
					res.setHeader(key,value);
					
					if (this.statusCode==400 || this.statusCode==401 || this.statusCode ==403) {
						this.statusCode = res.statusCode = 401;
						var header = res.getHeader('WWW-Authenticate');
						if (header && header.length>0) {
							var reg = /error="(\w*)"/;
							var t = header[0].match(reg);
							var errCode = t && t.length>1 && t[1] || null;
							if (errCode) {
								if (errCode == 'invalid_request') {
									this.statusCode = res.statusCode = 400;
								}
								else if (errCode == 'invalid_token') {
									this.statusCode = res.statusCode = 401;
								}
								else if (errCode == 'insufficient_scope') {
									this.statusCode = res.statusCode = 403;
								}
							}
							else {
								this.statusCode = res.statusCode = 401;
							}

						}
					}
				},
				end: function(body) {
					res.statusCode = this.statusCode;
					res.end(body);
				}
		}
		func(req,resHolder,next);
	}
}

Authenticator.prototype.authorize = function(strategy, options, callback) {
	return passport.authorize(strategy,options,callback);
}

Authenticator.prototype.session = function(options) {
	return passport.session(options);
}

Authenticator.prototype.serializeUser = function(fn, req, done) {
	return passport.serializeUser(fn,req,done);
}

Authenticator.prototype.deserializeUser = function(fn, req, done) {
	return passport.deserializeUser(fn,req,done);
}

Authenticator.prototype.transformAuthInfo = function(fn, req, done) {
	return passport.transformAuthInfo(fn,req,done);
}

Authenticator.prototype._strategy = function(name) {
	return passport._strategy(name);
}

exports = module.exports = new Authenticator();