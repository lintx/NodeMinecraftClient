class LinkModule {
    constructor(data){
        data = data || {};
        this.id = data.id || 0;
        this.user_id = data.user_id || 0;
        this.create_time = data.create_time || 0;
        this.end_time = data.end_time ||0;
        this.status = data.status || 0;
        this.config = new LinkConfig(data.config || {});
    }
}

class LinkConfig {
    constructor(json){
        let config;
        if (typeof json === "object") {
            config = json;
        }
        else {
            config = JSON.parse(json) || {}
        }
        this.username = config.username || "";
        this.password = config.password || null;
        this.version = config.version || null;
        this.host = config.host || "";
        this.port = config.port || 25565;
        this.session = config.session || null;
        this.autologin = config.autologin || false;

        config.pluginConfig = config.pluginConfig || {};
        this.pluginConfig = {
            autoattack:new AutoAttackConfig(config.pluginConfig.autoattack),
            autoconnect:new AutoConnectConfig(config.pluginConfig.autoconnect),
            autofish:new AutoFishConfig(config.pluginConfig.autofish),
            autofevive:new AutoFevive(config.pluginConfig.autofevive)
        };
    }

    getJson(){
        return JSON.stringify(this);
    }
}

class AutoAttackConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.yaw = config.yaw || null;
        this.dist = config.dist || null;
    }
}

class AutoConnectConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.tryCount = config.tryCount || 3;
        this.delay = config.delay || 30;
    }
}

class AutoFishConfig {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
        this.delay = config.delay || 1;
        this.timeout = config.timeout || 60;
    }
}

class AutoFevive {
    constructor(config){
        config = config || {};
        this.open = config.open || false;
    }
}

module.exports = {
    LinkModule,
    LinkConfig,
    AutoAttackConfig,
    AutoConnectConfig,
    AutoFishConfig,
    AutoFevive
};