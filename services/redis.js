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

module.exports.checkLottery = function(code, next){
    var client = internals.client;
    client.get(code, function (err, result) {
        if(err){
            next({status:false, results: '服务器维护中，请稍后再试'});
        }else if(result != null){
            client.set(code, 'used');
            console.log(code);
            if(result != 'used')
                next({status:true});
            else
                next({status:false, results: '该兑换码已使用，如有问题请联系我们：Email:pipilu@pamakids.com'});
        }else{
            next({status:false, results: '该兑换码未中奖，请检查是否输入正确，如有问题请及时联系我们：Email:pipilu@pamakids.com'});
        }
    });
}

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