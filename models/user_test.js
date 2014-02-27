var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var UserTest = new Schema({
    user:{type:String, index:{unique:true}},
    config:String
});

var Timestamps = require('mongoose-times');
UserTest.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

module.exports = Mongoose.model('UserTest', UserTest);