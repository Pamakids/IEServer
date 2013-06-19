var server = {
	cache: {
		engine: 'redis'
	},
	timeout: {
		server: 10000
	}
//    ,
//    auth: {
//        'basic': {
//            scheme: 'basic',
//            loadeUserFunc:loadUser
//        }
//    }
//    ,
//	auth: {
//		scheme: 'cookie',
//		password: 'secret',
//		ttl: 60*60,
//		cookie: 'sid',
//		clearInvalid: true,
//		validateFunc:validateUser,
//        allowInsecure:true
//	},
//	state:{
//		cookies:{
//			clearInvalid: true
//		}
//	}
};

server.debug = process.env.ENV == 'pro' ? false : {request : ['error', 'uncaught']};
exports.db = 'ie_server';
exports.server = server;

exports.uploaded_dir = 'up';

exports.email = {
	service: "Gmail",
	auth: {
		user: 'pamakidz@gmail.com',
		pass: 'banmaQQ@7831'
	}
};

exports.VERIFY_EMAIL_MESSAGE = {
	// sender info
    from: '斑马骑士 <pamakidz@gmail.com>',
    
    // Comma separated list of recipients
    to: '"ManiWang" <mani95lisa@gmail.com>',
    
    // Subject of the message
    subject: '请验证您的邮箱地址', //

    headers: {
        'X-Laziness-level': 1000
    },
    // plaintext body
    // text: 'Test2',
    
    html:'<html>Test</html>'
};

module.exports.errorMessage = function(errorCode){
    var message;
    switch(errorCode)
    {
        case 0:
            message = '用户不存在，请查证后输入';
            break;
        case 1:
            message = '密码错误，请重新输入';
            break;
        case 2:
            message = '密码错误次数超出，请两小时后再试'
            break;
        case 3:
            message = '用户名不能有@符号';
            break;
    }
    return message;
};