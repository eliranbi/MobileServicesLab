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

var  Q = require("q"),
    jws = require("jws"),
    RejectionMessage = require("./responses").RejectionMessage,
    ibmlogger   = require('./security-logger'),
    _ = require("underscore");

/**
 * A map of providers (e.g., "Google") and a function that will
 * return a promise that will resolve on one more more public keys/certs
 * 
 * @type {object}
 */
var TokenDecoder = {};
var providers = TokenDecoder.providers = {};

TokenDecoder.decode = function(payload) {
    var appId    = payload.applicationId,
        pubKey   = payload.appkey,
        token    = payload.access_token;

    if ( !appId || !token ) {
        return Q.reject(RejectionMessage('Missing the token or application id', {
            appId: appId,
            token: token
        }));
    }
   
    return doTokenValidation(token,pubKey,appId);
}

/**
 * provider:  Name of provider which maps to ibm-security-provider
 * initParameters:  JSON object defining provider initialization parameters
 */
TokenDecoder.registerProvider = function(provider, initParameters) {
    if (!initParameters) {
        throw new TypeError("Invalid provider registration content.");
    }

/**
 * getPublicKey:  Callback function to retrieve array of public keys for validating the token
 * options:   List of generic options for standard jsonwebtoken verify checks
 * claimChecks:   Extra checks to be performed against the claims in the payload.
 */
    providers[provider.toLowerCase()] = {
        options: initParameters.jwt_options,
        claimChecks: initParameters.header_checks
    };
}

TokenDecoder.getProviderInfo = function(provider) {
    var info = providers[provider.toLowerCase()];
    return (info && info.options) ? info : false;
}

/**
 * Verify the token with the public key.
 * And validate the exp, iss and aud with the decoded token.
 */
function doTokenValidation(token,publicKey,appId) {
	  var parts = token.split('.');
	  if (parts.length < 3) {
            ibmlogger.getLogger().debug("The token decode failure details:", token);
            return Q.reject(RejectionMessage("The token is malformed.", token,RejectionMessage.INVALID_TOKEN_ERROR));
	  }
		    
	  if (parts[2].trim() === '' && publicKey) {
		  return Q.reject(RejectionMessage("The token missing the signature.", token,RejectionMessage.INVALID_TOKEN_ERROR));
	  }

	  var valid;
	  if (publicKey) {
		  try {
		    valid = jws.verify(token, publicKey);
			if (!valid) {
				return Q.reject(RejectionMessage("The token was verified failed with the public key.", token,RejectionMessage.INVALID_TOKEN_ERROR));
			}
		  }
		  catch (e) {
			return Q.reject(RejectionMessage("An error occurred when verifying the token"+e.message, token, RejectionMessage.INVALID_TOKEN_ERROR));
		  }
	  }
	  
	  var decodedToken = jws.decode(token,{json:true});
	  if (!decodedToken) {
		  return Q.reject(RejectionMessage("The token was decoded failed", token, RejectionMessage.INVALID_TOKEN_ERROR));
	  }
	  
	  var payload = decodedToken.payload;
	  
	  if (payload.exp) {
		  if (Math.round(Date.now()) / 1000 >= payload.exp) {
			  return Q.reject(RejectionMessage("The token has been expired.", token, RejectionMessage.INVALID_TOKEN_ERROR));
		  }
	  }
	  
	  if (payload.aud) {
		  if (payload.aud != appId) {
			  return Q.reject(RejectionMessage("The aud in token is inconsistent with the given application id."+payload.aud+","+appId, token, RejectionMessage.INVALID_TOKEN_ERROR));
		  }
	  }
	  /*
	  if (options.audience) {
		  if (payload.aud !== options.audience) {
			  return Q.reject(RejectionMessage("The audience is different from the expected aud:"+options.audience, token, RejectionMessage.INVALID_TOKEN_ERROR));
		  }
	  }

	  if (options.issuer) {
		    if (payload.iss !== options.issuer) {
		    	return Q.reject(RejectionMessage("The issuer is different from the expected iss:"+options.issuer, token, RejectionMessage.INVALID_TOKEN_ERROR));
		    }
	  }
	  */
	  return Q.resolve(payload);
}

TokenDecoder.registerProvider("worklight", 
		{
			jwt_options 	: {},
			header_checks 	: {expirationKey: 'expiration', version: 'WL1.0'}
		}
	);

exports = module.exports = TokenDecoder;