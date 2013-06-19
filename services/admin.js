var Admin      = require('../models/admin');
var Reasons    = require('../config/reasons');
var Dateformat = require('dateformatter').format;

var internals = {};

internals.updateUser = function(req){
    var updateObject = req.payload;
    var admin = req.pre.admin;
    delete updateObject['id'];
    Admin.findOne({_id:updateObject._id}, function(err, result){
       if(err){
            req.reply({status:false, results:err.code});
       }else if(result){
           Object.keys(updateObject).forEach(function (key) {
               var val = updateObject[key];
               console.log(key, val);
               result[key] = val;
           });
           if(admin)
                result.updator = new Admin(admin);
           result.save(function(err, result){
               if(err)
               {
                   req.reply({status:false, results:err.code});
               }else{
                   req.reply({status:true});
               }
           })
       }
    });
};

internals.deleteUser = function(req){
    var updateObject = req.payload;
    var admin = req.pre.admin;
    delete updateObject['id'];
    Admin.findOne({_id:updateObject._id}, function(err, result){
        if(err){
            req.reply({status:false, results:err.code});
        }else if(result){
            result.enabled = false;
            if(admin)
                result.updator = new Admin(admin);
            result.save(function(err, result){
                if(err)
                {
                    req.reply({status:false, results:err.code});
                }else{
                    req.reply({status:true});
                }
            })
        }
    });
}

internals.getUsers = function(req) {
    console.log(req.query, req.pre.admin);
    Admin.getUsers(req.query, function(err, results){
    	if(err){
    		req.reply({status:false, results:err.code});
    	}else{
    		req.reply({status:true, results:results});
			console.log(results);
    	}
    });
};

internals.signIn = function(req){
	console.log("Admin Sign In: %j, Time: %s",req.payload, Dateformat('Y-m-d H:i:s', Date.now()));

	Admin.getAuthenticated(req.payload.account, req.payload.password, function(err, admin,reason){
		if(err){
			req.reply({status:false, results:err.code});
		}else if(admin){
			console.log('Admin %j SignedIn Sucess!', admin.worker_id);
			var helpers = req.server.helpers;
			helpers.setUser(admin, function(result){
				console.log('Admin Cached: ', result);
			});
			req.reply({status:true, results:admin});
		}else{
            req.reply({status:false, results:Reasons.message(reason)});
        }
	});
}

internals.signUp = function(req) {
    var o = req.payload;
    delete o['id'];
    var admin = new Admin(o);
    var creator = req.pre.admin;
    if(creator)
        admin.creator = new Admin(creator);
    console.log('SignUp Admin: %j', admin);
    admin.save(function(err, user){
    	if(err){
    		console.log('Admin SignUp Error', err);
    		req.reply({status:false, results:Reasons.message(err.code)});
    	}else{
    		req.reply({status:true, results:user});
    	}
    });
};

module.exports = internals;