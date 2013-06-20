var Formidable = require('formidable');
var Path = require('path');
var fs = require('fs');
var UFile = require('../models/ufile');
var DataFile = require('../models/data_file.js');
var config    = require('../config/config');
var IM = require('imagemagick');

module.exports.upload = function (req) {
    var form = new Formidable.IncomingForm();
    var date = new Date();
    var dir = process.cwd() + '/'+config.uploaded_dir+'/'+date.getFullYear()+ (date.getMonth()+1)+ date.getDate();
    var fs = require('node-fs');
    fs.mkdirSync(dir, 0777, true);
    var request = req.raw.req;
    request.resume();
    form.uploadDir = dir;
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.parse(request, function (err, fields, files) {
        if (err) {
            console.log('Err', err);
        } else {
            var files = files.upload;
            var size = files.size;
            var path = files.path;

            if(!fields.id && !fields.device_id)
            {
                req.reply(false);
                fs.unlink(path);
                return;
            }

            var w = fields.w;
            var h = fields.h;
            var type = Path.extname(name);
            var name = files.name;
            var fileSavedName = Path.basename(path);
            var relativePath = path.replace(process.cwd(), '');
            console.log("Size: %s\n Path: %s\n Name: %s\n Type: %s\n FileSavedName: %s\n", size, path, name, type, fileSavedName);
            if(w || h)
            {
                var options = {
                    srcPath: path,
                    dstPath: path.replace(type, '') + w + 'x' + h + type};
                if(w)
                    options.width = w;
                if(h)
                    options.height = h;
                IM.resize(options, function(err, stdout, stderr){
                    if(err) throw err;
                    req.reply(relativePath);
                });
            }else
            {
                req.reply(relativePath);
            }
            if(fields.id){
                var uf = new UFile({uploader:fields.id, type:type, size:size, path:path});
                uf.save();
            }else if(fields.device_id){
                var df = new DataFile({device_id: fields.device_id, size: size, path: path});
                df.save();
            }
        }
    });

    form.on('progress', function (received, expected) {
        console.log('Progress:' + received / expected);
    });

    form.on('error', function (err) {
        console.log('Error', err);
    });

    form.on('aborted', function () {
        console.log('Aborted');
    });

    form.on('end', function () {
        console.log('Upload File End!');
    });
};