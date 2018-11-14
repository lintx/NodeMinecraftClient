const AutoConnectModule = require('../../server/model/linkmodule').AutoConnectConfig;

let timeOut = -1;
let isopen = false;
function bindEvent(client, autoconnect) {
    client.on('lmc:disconnect', ()=>{
        if (isopen === false) {
            isopen = true;
            autoconnect.tryCount = 0;
            client.emit('lmc:plugin',{plugin:'autoconnect',message:`发现游戏掉线，启动重连程序，最大尝试次数： ${autoconnect.config.tryMaxCount} ，登录延时：${autoconnect.config.delay}秒`});
            runReConnect(client,autoconnect);
        }
    });
}

function runReConnect(client, autoconnect) {
    if (autoconnect.config.open && timeOut === -1) {
        autoconnect.tryCount += 1;
        if (autoconnect.tryCount <= autoconnect.config.tryMaxCount) {
            timeOut = setTimeout(()=>{
                timeOut = -1;
                tryReConnect(client,autoconnect);
            },autoconnect.config.delay*1000);
        }
        else {
            isopen = false;
            client.emit('lmc:plugin',{plugin:'autoconnect',message:`第 ${autoconnect.tryCount} 次尝试重新连接后依然没有成功，尝试次数已达上限，停止尝试重新连接`});
        }
    }
}

function tryReConnect(client, autoconnect) {
    if (!client.isConnect) {
        client.emit('lmc:plugin',{plugin:'autoconnect',message:`第 ${autoconnect.tryCount} 次尝试重新连接`});
        autoconnect.client.connect();
        runReConnect(client,autoconnect);
    }
    else {
        client.emit('lmc:plugin',{plugin:'autoconnect',message:`第 ${autoconnect.tryCount-1} 次尝试重新连接时已经连接成功`});
        isopen = false;
    }
}

class AutoConnect {
    constructor(client,config){
        if (!(config instanceof AutoConnectModule)) {
            config = new AutoConnectModule()
        }
        this.config = config;
        this.client = client;
        this.tryCount  = 0;

        bindEvent(client,this);
    }
}

module.exports = AutoConnect;