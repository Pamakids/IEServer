var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Bcrypt = require('bcrypt');
var SALT_WOR_FACTOR = 10;
var MAX_LOGIN_ATTEMPTS = 5;
var LOCK_TIME = 2*60*60*1000
var PATHS_FOR_LOGIN = '-updator';
var EventProxy = require('eventproxy');

var Admin = new Schema({
	worker_id:{type:Number, require:true, index:{unique:true}},
	password:{type:'String', require:true},
	mobile_phone_num:{type:'String', require:true, index:{unique:true}},
	enabled:{type:Boolean, default:true},
	privilege:{type:'String', require:true},
	email:{type:'String',index:{sparse:true}},
	birthday:Date,
	portrait:String, //头像
	true_name:String,
	creator:{type:Schema.ObjectId, ref:'Admin'},
	updator:{type:Schema.ObjectId, ref:'Admin'},
	login_attempts:{type:Number, default:0},
	lock_until:Number,
    last_login_time:Date
});


var Timestamps = require('mongoose-times');
Admin.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

Admin.virtual('isLocked').get(function(){
	return !!(this.lock_until && this.lock_until > Date.now());
});

Admin.pre('save', function(next){
	var user = this;
	if(!user.isModified('password') || user.password==='') return next();

    if(user.birthday && typeof user.birthday == 'string')
        user.birthday = new Date(user.birthday);

    Bcrypt.genSalt(SALT_WOR_FACTOR, function(err, salt){
		if(err) return next(err);

		Bcrypt.hash(user.password, salt, function(err, hash){
			if(err) return next(err);

			user.password = hash;
			next();
		});
	});
});

Admin.methods.comparePassword = function(password, callback){
	Bcrypt.compare(password, this.password, function(err, isMath){
		if(err) return cb(err);
		callback(null, isMath);
	});
};

Admin.methods.incLoginAttempts = function(callback){
	if(this.lock_until && this.lock_until < Date.now()){
		return this.update({
			$set : {login_attempts : 1},
			$unset : {lock_until : 1}
		}, callback);
	}

	var updates = {$inc:{login_attempts:1}};
	if(this.login_attempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked){
		updates.$set = {lock_until:Date.now() + LOCK_TIME};
	}
	return this.update(updates, callback);

};

Admin.statics = {
	failedReasons:{
		NOT_FOUND: 0,
		PASSWORD_INCORRECT: 1,
		MAX_ATTEMPTS: 2,
		INVALID_SYMBOLE: 3
	},
	getUsers: function(options, callback) {
		var query = options.query || {};
		this.find(query)
            .populate('creator', 'worker_id')
			.sort({'created_at': -1})
			.limit(options.perPage)
			.skip(options.perPage * (options.page-1))
			.exec(callback);
	},
	getAuthenticated : function(numberOrEmailOrPhoneNum, password, callback){
		var query = {};
		var reasons = require('../config/reasons');

		if(numberOrEmailOrPhoneNum.indexOf('@') != -1){
			query.email = numberOrEmailOrPhoneNum;
		}else if(numberOrEmailOrPhoneNum.length == 13 && parseInt(numberOrEmailOrPhoneNum)){
			query.mobile_phone_num = numberOrEmailOrPhoneNum;
		}else{
			query.worker_id = numberOrEmailOrPhoneNum;
		}

        query.enabled = true;

		this.findOne(query, PATHS_FOR_LOGIN, function(err, admin){
			if(err) return callback(err);

			if(!admin)	return callback(null, null, reasons.NOT_FOUND);

			if(admin.isLocked){
				return admin.incLoginAttempts(function(err){
					if(err) return callback(err);
					return callback(null, null, reasons.MAX_ATTEMPTS);
				});
			}

			admin.comparePassword(password, function(err, isMath){
				if(err) return callback(err);

				if(isMath){

                    admin.last_login_time = new Date();
                    admin.save();

					if(!admin.login_attempts && !admin.lock_until) return callback(null, admin);
					var updates = {
						$set:{login_attempts : 0},
						$unset:{lock_until:1}
					};

					admin.update(updates, function(err){
						if(err) return callback(err);
						return callback(null, admin);
					});
				}

				admin.incLoginAttempts(function(err){
					if(err) return callback(err);
					return callback(null, null, reasons.PASSWORD_INCORRECT);
				})
			});
		});
	}
};

module.exports = Mongoose.model('Admin', Admin);