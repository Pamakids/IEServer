module.exports = {
	NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2,
    INVALID_SYMBOLE: 3
};

module.exports.message = function(reason, callback){
	var message;
    switch(reason)
    {
        case 0:
            message = '用户不存在，请查证后输入';
            break;
        case 1:
            message = '密码错误，请重新输入';
            break;
        case 2:
            message = '密码错误次数超出，请两小时后再试';
            break;
        case 22:
            message = '您尚未登陆，请先登陆再试';
            break;
        case 11000:
        	message = '用户已存在，请重试';
        	break;
    }
    return message;
}