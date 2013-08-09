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
            next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
        }else if(result != null){
            client.set(code, 'used');
            console.log(code);
            if(result != 'used')
                next({status:true});
            else
                next({status:false, results: '该兑换码已使用，如果您想同时在其它设备上使用，敬请联系 @斑马骑士 官方微博或 Email:pipilu@pamakids.com 进行申请'});
        }else{
            next({status:false, results: '该兑换码不存在，请检查是否输入正确，如有问题请联系 @斑马骑士 官方微博或 Email:pipilu@pamakids.com'});
        }
    });
}

module.exports.checkStatus = function(code, next){
    var client = internals.client;
    client.get(code, function (err, result) {
        if(err){
            next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
        }else if(result != null){
            console.log(code);
                next({status:true, results: result});
        }else{
            next({status:false, results: '该兑换码不存在，请检查是否输入正确，如有问题请联系 @斑马骑士 官方微博或 Email:pipilu@pamakids.com'});
        }
    });
}

module.exports.refreshCode = function(code, next){
    var client = internals.client;
    client.get(code, function (err, result) {
        if(err){
            next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
        }else if(result != null){
            client.set(code, 'used');
            console.log(code);
            if(result == 'used')
            {
                client.set(code, true, function(err, result){
                    if(err){
                        next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
                    }else{
                        next({status:true, results: code});
                    }
                })
            }
            else
            {
                next({status:false, results: '该兑换码尚未使用，无需刷新'});
            }
        }else{
            next({status:false, results: '该兑换码不存在，请检查是否输入正确，如有问题请联系 @斑马骑士 官方微博或 Email:pipilu@pamakids.com'});
        }
    });
}

module.exports.generateCode = function(next){
    doGenerate(next);
}

function doGenerate(next){
    var code = getRandmNum();
    var client = internals.client;
    client.get(code, function(err, result){
        if(err){
            next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
        }else if(result != null){
            doGenerate(next);
        }else{
            client.set(code, true, function(err, result){
                if(err)
                    return next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
                next({status:true, results: code});
            })
        }
    })
}

function getRandmNum() {
    var mr = Math.random();
    while(mr < 0.1)
        mr = Math.random();
    var randomNumber = mr * 999999 | 0;
    var str = randomNumber.toString();
    str = str.replace(/4/g, '8');
    return Number(str);
}

module.exports.listCodes = function(next){
    var client = internals.client;
    client.dbsize(function(err, result){
        if(err)
            return next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
        return next({status:true, results: result});
    })
//    client.keys('*', function(err, keys){
//        if(err)
//            return next({status:false, results: '非常抱歉，服务器维护中，请稍后再试！'});
//        client.mget(keys, function(err, res){
//            return next({status:true, results: [keys, res]});
//        })
//    })
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