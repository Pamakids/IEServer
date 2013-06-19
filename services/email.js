var Mailer = require('nodemailer');
var config = require('../config/config');

var internals = {};

internals.init = function(){
    internals.transport = Mailer.createTransport('SMTP', config.email);
    console.log('SMTP Configured!');
};

internals.init();

internals.verifyEmailMessage = function(code, to){
    var message = config.VERIFY_EMAIL_MESSAGE;
    message.html = '<html>您的邮箱验证码是： '+code+'</html>';
    message.to = to;
    return message;
};

internals.sendMail = function(mailOptions) {
    internals.transport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.error('Sent email error: ' + error);
        } else {
            console.log('Sent mail: ' + response.message);
        }
    });
};

module.exports = internals;