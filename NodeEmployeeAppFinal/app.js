/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var passport = require('passport');
var ImfBackendStrategy = require('passport-imf-token-validation').ImfBackendStrategy;

var options = {};
try{
	passport.use(new ImfBackendStrategy());	
}catch(e){
	console.log(">> e: " + e);
}


// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use(passport.initialize());

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


app.get('/employees', passport.authenticate('imf-backend-strategy', {session: false }), function (req, res) {
	//app.get('/employees', function (req, res) {
	var employee = {name: 'eliran ishay', mobile: '347-307-4400', age: '35' };
	//res.send(employee);
	res.sendfile('public/data.json');
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
