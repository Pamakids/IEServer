var Hapi      = require('hapi');
var Redis     = require('./services/redis');
var Mongo     = require('./services/mongo');
var Routes    = require('./config/routes');
var config    = require('./config/config');
var internals = {};

internals.main = function(){
	
	var server = new Hapi.Server(process.env.PORT || 9050, config.server);

	server.ext('onRequest', function(request, next){
		console.log('On Request:', request.path);
		next();
	});

//    server.ext('onPreResponse', function (request, next) {
//        console.log('onPreResponse', request.response());
//       if(request.response().isBoom){
//           var error = request.response();
////           error.response.payload.message = 'Error';
//       }
//       next();
//    });

	server.helper('getUser', Redis.getUser);
	server.helper('setUser', Redis.setUser);

	server.route(Routes);

	server.start();
};

internals.main();