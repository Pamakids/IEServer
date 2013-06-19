var Redis     = require('redis');
var internals = {};

internals.init = function init() {
	internals.EXPIRE_TIME = 60 * 60;

	var client = Redis.createClient(null, null, {
		max_attempts: 8
	});
	client.on('error', function(err) {
		console.log('Reids Error:', err);
	});

	internals.client = client;
};

internals.init();

module.exports.setUser = function(user, next) {
	var client = internals.client;
	client.setex(user.id, internals.EXPIRE_TIME, JSON.stringify(user), function(err, res) {
		if (err) console.error("Set User Error: ", err);
		res ? next(res) : next(null);
	});
};

module.exports.getUser = function(id, next) {
	var client = internals.client;
	client.get(id, function(err, reply) {
		if (err) console.error('Get User Error:', err);
        if(reply){
            next(reply);
            client.expire(id, internals.EXPIRE_TIME);
        }else{
            next(null);
        }

	});
};