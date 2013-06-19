var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var MAX_LOGIN_ATTEMPTS = 5;
var LOCK_TIME = 2 * 60 * 60 * 1000;
var EventProxy = require('eventproxy');

var UserSchema = new Schema({
    member_id: {type: Number, index: {unique: true}},
    mobile_phone_num: {type: 'String', trim: true, required: true, index: {unique: true, sparse: true}},
    email: {type: 'String', trim: true, index: {unique: true, sparse: true}},
    password: {type: 'String', required: true},
    type: String, //normal, partner
    true_name: String,
    id_card_num: String,
    id_card_pic_front: String,
    id_card_pic_back:String,
    gender: String,
    verified: String,
    enabled: {type: Boolean, default: true},
    verify_code: String,
    creator: {type: Schema.ObjectId, ref: 'Admin'},
    updator: {type: Schema.ObjectId, ref: 'Admin'},
    loginAttempts: {type: Number, default: 0},
    lockUntil: {type: Number},
    provider: String, //来自哪里的用户
    birthday: String,
    last_check_in_time: Date,
    last_login_time:Date, //最近登陆时间
    signed_in_times:Number //登陆次数
});

var Timestamps = require('mongoose-times');
UserSchema.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    var ep = new EventProxy();
    ep.on('hashPassword', function () {
        // generate a salt
        Bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) return next(err);

            // hash the password using our new salt
            Bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err);

                // set the hashed password back on our user document
                user.password = hash;
                next();
            });
        });
    });

    if(user.member_id)
    {
        ep.emit('hashPassword');
    }else{
        getMemberID(function (memeberID) {
            user.member_id = memeberID;
            ep.emit('hashPassword');
        });
    }
});

function getMemberID(callback) {
    var memberID = getRandmNum();
    console.log(memberID);
    Mongoose.model('User', UserSchema).findOne({'member_id': memberID}, function (err, user) {
        if (err) {
            callback(err);
        }
        if (user) {
            getMemberID(callback);
        } else {
            callback(memberID);
        }
    });
}

function getRandmNum() {
    var ok = false;
    while (!ok) {
        ok = true;
        var randomNumber = Math.random() * 1000000 | 0;
        var str = randomNumber.toString();
        str = str.replace(/4/g, '8');
        var dic = {};
        for (var i = 0; i < str.length; i++) {
            var char = str.charAt(i);
            dic[char] ? dic[char]++ : dic[char] = 1;
            if (dic[char] > 3)
                ok = false;
        }
    }
    return Number(str);
}

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    Bcrypt.compare(candidatePassword, this.password, function (err, isMath) {
        if (err) return cb(err);
        cb(null, isMath);
    })
};

UserSchema.methods.incLoginAttempts = function (cb) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, cb);
    }
    // otherwise we're incrementing
    var updates = { $inc: { loginAttempts: 1 } };
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    return this.update(updates, cb);
};

UserSchema.virtual('email_v').get(function () {
    return verified && verified.indexOf('e') != -1;
});
UserSchema.virtual('phone_v').get(function () {
    return verified && verified.indexOf('p') != -1;
});

var VERIFIED_EMAIL = 1,
    VERIFIED_PHONE = 2,
    VERIFIED_EMAIL_AND_PHONE = 3;

UserSchema.statics = {
    updateUser: function(user, callback){
        this.findOneAndUpdate(user.id, user, callback);
    },
    getUsers: function(options, callback){
        var query = options.query || null;

        this.find(query)
            .populate('creator', 'worker_id')
            .populate('updator', 'worker_id')
            .sort({'created_at': -1})
            .limit(options.perPage)
            .skip(options.perPage * (options.page - 1))
            .exec(callback);
    },
    getAuthenticated: function (MemberIDOrEmailOrPhoneNum, password, cb) {
        var reasons = require('../config/reasons');
        var query = {};
        var nameOrEmailOrPhoneNum = String(MemberIDOrEmailOrPhoneNum);
        if (nameOrEmailOrPhoneNum.indexOf('@') != -1) {
            query.email = nameOrEmailOrPhoneNum;
            query.verified = {$in: [VERIFIED_EMAIL, VERIFIED_EMAIL_AND_PHONE]};
        }
        else if (nameOrEmailOrPhoneNum.length == 13 && parseInt(nameOrEmailOrPhoneNum)) {
            query.m_phone_num = nameOrEmailOrPhoneNum;
            query.verified = {$in: [VERIFIED_PHONE, VERIFIED_EMAIL_AND_PHONE]};
        }
        else {
            query.member_id = nameOrEmailOrPhoneNum;
        }

        this.findOne(query, function (err, user) {
            if (err) return cb(err);
            // make sure the user exists
            if (!user) {
                return cb(null, null, reasons.NOT_FOUND);
            }

            // check if the account is currently locked
            if (user.isLocked) {
                // just increment login attempts if account is already locked
                return user.incLoginAttempts(function (err) {
                    if (err) return cb(err);
                    return cb(null, null, reasons.MAX_ATTEMPTS);
                });
            }

            // test for a matching password
            user.comparePassword(password, function (err, isMatch) {
                if (err) return cb(err);

                // check if the password was a match
                if (isMatch) {
                    user.last_login_time = new Date();
                    user.signed_in_times += 1;
                    user.save();
                    // if there's no lock or failed attempts, just return the user
                    if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
                    // reset attempts and lock info
                    var updates = {
                        $set: { loginAttempts: 0 },
                        $unset: { lockUntil: 1 }
                    };
                    user.update(updates, function (err) {
                        if (err) return cb(err);
                        return cb(null, user);
                    });
                }

                // password is incorrect, so increment login attempts before responding
                user.incLoginAttempts(function (err) {
                    if (err) return cb(err);
                    return cb(null, null, reasons.PASSWORD_INCORRECT);
                });
            });
        });
    }
}

UserSchema.statics.verify = function (code, usefor, cb) {

};

module.exports = Mongoose.model('User', UserSchema);
