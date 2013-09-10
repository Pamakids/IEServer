var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var UFile = new Schema({
    uploader:{type:String, required:true, index:true},
    type:String,
    size:Number,
    path:String,
    used:Boolean,
    created_at:Date,
    updated_at:Date
});

var Timestamps = require('mongoose-times');
UFile.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

UFile.statics = {
    list: function(options,callback){
        var query = options ? options.query : null;
        this.find(query)
            .limit(options.perPage)
            .skip(options.perPage * (options.page - 1))
            .exec(callback);
    }
}

module.exports = Mongoose.model('UFile', UFile);