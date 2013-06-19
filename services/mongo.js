var Mongoose = require('mongoose');
var connectString = process.env.DB || 'mongodb://localhost/'+require('../config/config').db;

var internals = {};

internals.init = function(){
	if(process.env.ENV != 'pro')
		Mongoose.set('debug', true);
	Mongoose.connect(connectString);
	var connection = Mongoose.connection;
	connection.setProfiling(1, function(err){
		console.log('DB Profiling Setted!');
	});
	connection.on('error', function(err){
		console.log('DB Connect Failed!', err);
	});
	connection.on('open', function(){
		console.log('DB Connected!');
	});
};

internals.init();