var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var ClientSchema = new Schema({

});

var Timestamps = require('mongoose-times');
UserSchema.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});