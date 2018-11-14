const stringRandom = require('string-random');
const crypto=require("crypto");

function aesEncrypt(data, key) {
    const cipher = crypto.createCipher('aes192', key);
    var crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function aesDecrypt(encrypted, key) {
    const decipher = crypto.createDecipher('aes192', key);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * 存储时应该调用getDbData方法获取
 */
class LinkModule {
    constructor(data){
        data = data || {};
        this.id = data.id || 0;
        this.user_id = data.user_id || 0;
        this.create_time = data.create_time || 0;
        this.end_time = data.end_time || 0;
        this.name = data.name || '';
        // this.status = data.status || 0;
        this.config = new LinkConfig(data.config || {},this.salt);
    }

    getDbData(){
        let module = new LinkModule(this);
        if (module.config.userConfig.password !== null) {
            module.config.userConfig.password = aesEncrypt(module.config.userConfig.password,module.config.userConfig.salt);
            module.config.userConfig.passwordIsEncrypt = true;
        }
        module.config = JSON.stringify(module.config);
        return module;
    }
}

class LinkConfig {
    constructor(json,salt){
        let config;
        if (typeof json === "object") {
            config = json;
        }
        else {
            config = JSON.parse(json) || {}
        }

        this.userConfig = new McUserConfig(config.userConfig || {});
        config.pluginConfig = config.pluginConfig || {};
        this.pluginConfig = {
            autoattack:new AutoAttackConfig(config.pluginConfig.autoattack),
            autoconnect:new AutoConnectConfig(config.pluginConfig.autoconnect),
            autofish:new AutoFishConfig(config.pluginConfig.autofish),
            autofevive:new AutoFevive(config.pluginConfig.autofevive),
            autochat:new AutoChat(config.pluginConfig.autochat)
        };
    }
}

class McUserConfig {
    constructor(config){
        config = config || {};
        this.username = config.username || "";
        this.password = config.password || null;
        this.version = config.version || null;
        this.host = config.host || "";
        this.port = config.port || 25565;
        this.session = config.session || null;
        this.islogin = config.islogin || false;//用户在手动连接或断开连接时改变
        this.salt = config.salt || null;
        if (this.salt === null) {
            this.salt = stringRandom(10);
        }
        else {
            if (config.passwordIsEncrypt === true) {
                this.password = aesDecrypt(this.password,this.salt);
                config.passwordIsEncrypt = false;
            }
        }
    }
}

class AutoAttackConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.yaw = config.yaw || 120;
        this.dist = config.dist || 3;
    }
}

class AutoConnectConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.tryMaxCount = config.tryMaxCount || 3;
        this.delay = config.delay || 30;
    }
}

class AutoFishConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.delay = config.delay || 1;
        this.timeout = config.timeout || 100;
    }
}

class AutoFevive {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
    }
}

class AutoChat {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        config.chats = config.chats || [];
        this.chats = [];
        let self = this;
        config.chats.forEach((chat)=>{
            self.chats.push(new AutoChatMode(chat));
        });
    }
}

/**
 * mode:
 * 0:一次性
 * 1:周期性
 */
class AutoChatMode{
    constructor(chat){
        chat = chat || {};
        this.open = chat.open || false;
        this.chat = chat.chat || "";
        this.mode = chat.mode || 0;
        this.time = chat.time || 60;
    }
}

module.exports = {
    LinkModule,
    LinkConfig,
    AutoAttackConfig,
    AutoConnectConfig,
    AutoFishConfig,
    AutoFevive,
    AutoChat,
    AutoChatMode,
    McUserConfig
};