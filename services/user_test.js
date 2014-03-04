var UserTest      = require('../models/user_test');

module.exports.update = function(req){
    var payload = req.query;
    UserTest.update({user:payload.u}, {config:payload.c}, {upsert:true}, function(err, result){
        if(err){
            req.reply({status:false, results:err.code});
        }else{
            req.reply({status:true});
        }
    });
};

module.exports.getALL = function(req){
    UserTest.find({}, function (err, result) {
        if(err){
            req.reply({status:false, results:err.code});
        }else if(result){
            req.reply({status:true, results: result});
        }else{
            req.reply({status:false, results:'没有用户存在'});
        }
    });
}

module.exports.getConfig = function(req) {
    console.log(req.query, req.pre.admin);
    var q = req.query;
    if(!q.u)
    {
        req.reply({status:false, results:'u参数不能为空'});
        return;
    }
    UserTest.findOne({user: q.u}, function(err, result){
    	if(err){
    		req.reply({status:false, results:err.code});
    	}else if(result){
    		req.reply({status:true, results: result.config});
			console.log(result.config);
    	}else{
            req.reply({status:false, results:'该用户不存在'});
        }
    });
};