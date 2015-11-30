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

var imfService;
var applicationId;

var FilterUtil = {};

FilterUtil.getJson = function(jsonData) {
	var json = jsonData;
	if (typeof jsonData == 'string') {
		json = JSON.parse(jsonData);
	}
	
	return json;
}

FilterUtil.clone = function(object) {
	var cloneObj = {};
	
	if (object) {		
		for(var prop in object) {
			cloneObj[prop] = object[prop];
		}
	}
	return cloneObj;
}

FilterUtil.getEnvProperty = function(propName,defaultValue) {
	var result = process.env[propName] || defaultValue;
	if (result) {
		result = result.trim();
	}
	
	return result;
}

FilterUtil.getAppIdFromUrl = function(url) {
	var result = null;
	var reg = /([0-9,a-f]{8}-[0-9,a-f]{4}-[0-9,a-f]{4}-[0-9,a-f]{4}-[0-9,a-f]{12}){1}/ig;
	if (url) {
		var matches = url.match(reg);
		result = matches && matches.length>0 && matches[0];
	}
	
	return result;
}

FilterUtil.getApplicationIdFromVcap = function() {
	if (! applicationId) {
		var vcapApplication = FilterUtil.getJson(process.env['VCAP_APPLICATION']);
		applicationId = vcapApplication && vcapApplication['application_id'];
	}
	
	return applicationId;
}

FilterUtil.getServerUrlFromVcap = function() {
	var imfService = getImfService();
	var serverUrl = imfService && imfService['credentials'] && imfService['credentials']['serverUrl'];
	
	return serverUrl;
}

FilterUtil.getArrayFromString = function(value,delim) {
	var array = [];
	if (value) {
		var a = value.split(delim);
		if (a && a.length>0) {
			a.forEach(function(item){
				array.push(item.trim());
			});
		}
	}
	return array;
}

function getImfService() {
	
	if (! imfService) {
		var vcapServices = FilterUtil.getJson(process.env['VCAP_SERVICES']);
		for (var prop in vcapServices) {
			if (prop.indexOf('AdvancedMobileAccess') == 0 && vcapServices[prop].length>0) {
				imfService = vcapServices[prop][0];
			}
		}
	}
	
	return imfService;
}

exports = module.exports=FilterUtil