var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var DataFile = new Schema({
    device_id:{type:String, index:true, required:true},
    size:Number,
    path:String,
    created_at:Date,
    updated_at:Date
});

var Timestamps = require('mongoose-times');
DataFile.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

DataFile.statics = {
    list: function(options,callback){
        var query = options.query;
        this.find(query)
            .limit(options.perPage)
            .skip(options.perPage * (options.page - 1))
            .exec(callback);
    }
}

module.exports = Mongoose.model('DataFile', DataFile);