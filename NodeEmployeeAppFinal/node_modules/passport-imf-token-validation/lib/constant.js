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

var Constant = {}

Constant.TRACKING_ID_HEADER = "x-wl-analytics-tracking-id";
Constant.ORIGIN = "worklight-oauth-node";
Constant.AUTHORIZATION_FAILED_MISSING_PARAMETER = "AUTHORIZATION_FAILED_MISSING_PARAMETER";
Constant.AUTHORIZATION_FAILED_MISSING_AUTH_HEADER = "AUTHORIZATION_FAILED_MISSING_AUTH_HEADER";
Constant.AUTHORIZATION_FAILED_MISSING_TOKEN = "AUTHORIZATION_FAILED_MISSING_TOKEN";
Constant.AUTHORIZATION_FAILED_INSUFFICIENT_SCOPE = "AUTHORIZATION_FAILED_INSUFFICIENT_SCOPE";
Constant.TOKEN_FAILED_UNABLE_TO_DETERMINE_SCOPE = "TOKEN_FAILED_UNABLE_TO_DETERMINE_SCOPE";
Constant.AUTHORIZATION_FAILED_INVALID_ACCESS_TOKEN = "AUTHORIZATION_FAILED_INVALID_ACCESS_TOKEN";
Constant.AUTHORIZATION_FAILED_INVALID_ID_TOKEN = "AUTHORIZATION_FAILED_INVALID_ID_TOKEN";
Constant.AUTHORIZATION_FAILED_INTERNAL_ERROR = "AUTHORIZATION_FAILED_INTERNAL_ERROR";
Constant.AUTHORIZATION_FAILED_INTERNAL_SERVER_ERROR = "AUTHORIZATION_FAILED_INTERNAL_SERVER_ERROR";
Constant.AUTHORIZATION_SUCCESS = "AUTHORIZATION_SUCCESS";
Constant.CLIENT_ID = "clientid";
Constant.IMF_APPLICATION = "imf.application";
Constant.IMF_DEVICE = "imf.device";
Constant.WORKLIGHT = 'worklight';

Constant.MobileSecurityValidation = "MobileSecurityValidation";

exports = module.exports = Constant;