const AutoConnectModule = require('../../server/model/linkmodule').AutoConnectConfig;

function bindEvent(client, autoconnect) {
    let lastAliveTime = Date.now();
    client.on('lmc:connect', function (packet) {
        autoconnect.isConnect = true;
    });
    client.on('lmc:disconnect', ()=>{
        autoconnect.isConnect = false;
        autoconnect.tryCount = 0;
        runReConnect(client,autoconnect);
    });
}

function runReConnect(client, autoconnect) {
    if (autoconnect.config.open) {
        autoconnect.tryCount += 1;
        if (autoconnect.tryCount <= autoconnect.config.tryMaxCount) {
            setTimeout(()=>{
                tryReConnect(client,autoconnect);
            },autoconnect.config.delay*1000);
        }
        else {
            client.emit('lmc:plugin',{plugin:'autoconnect',message:`第 ${autoconnect.tryCount} 次尝试重新连接后依然没有成功，尝试次数已达上限，停止尝试重新连接`});
        }
    }
}

function tryReConnect(client, autoconnect) {
    // console.log("reconnect,",autoconnect.isConnect,autoconnect.tryCount)
    if (!autoconnect.isConnect) {
        client.emit('lmc:plugin',{plugin:'autoconnect',message:`第 ${autoconnect.tryCount} 次尝试重新连接`});
        autoconnect.client.connect();
        runReConnect(client,autoconnect);
    }
}

class AutoConnect {
    constructor(client,config){
        if (!(config instanceof AutoConnectModule)) {
            config = new AutoConnectModule()
        }
        this.config = config;
        this.client = client;
        this.isConnect = false;
        this.tryCount  = 0;

        bindEvent(client,this);
    }
}

module.exports = AutoConnect;