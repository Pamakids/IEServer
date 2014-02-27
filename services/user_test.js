var UserTest      = require('../models/user_test');

module.exports.update = function(req){
    var payload = req.query;
    UserTest.update({user:payload.u}, {config:payload.c}, {upsert:true}, function(err, result){
        if(err){
            req.reply({status:false, result:err.code});
        }else{
            req.reply({status:true});
        }
    });
};

module.exports.getConfig = function(req) {
    console.log(req.query, req.pre.admin);
    var q = req.query;
    if(!q.u)
    {
        req.reply({status:false, result:'u参数不能为空'});
        return;
    }
    UserTest.findOne({user: q.u}, function(err, result){
    	if(err){
    		req.reply({status:false, result:err.code});
    	}else if(result){
    		req.reply({status:true, result: result.config});
			console.log(result.config);
    	}else{
            req.reply({status:false, result:'该用户不存在'});
        }
    });
};