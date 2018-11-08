function bindEvent(client, autoconnect) {
    client.on('connect', function (packet) {
        autoconnect.isConnect = true;
    });
    client.on('disconnect', function (packet) {
        // console.log("disconnect")
        autoconnect.isConnect = false;
        autoconnect.tryCount = 0;
        runReConnect(client,autoconnect);
    });
    client.on('kick_disconnect', (packet)=>{
        autoconnect.isConnect = false;
        autoconnect.tryCount = 0;
        // console.log("kick_disconnect,",packet)
        runReConnect(client,autoconnect);
    });
}

function runReConnect(client, autoconnect) {
    if (autoconnect.open) {
        autoconnect.tryCount += 1;
        if (autoconnect.tryCount <= autoconnect.tryMaxCount) {
            setTimeout(()=>{
                tryReConnect(client,autoconnect);
            },autoconnect.delay*1000);
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
    constructor(client){
        this.client = client;
        this.isConnect = false;
        this.open = false;
        this.tryMaxCount = 3;
        this.tryCount  = 0;
        this.delay = 30;

        bindEvent(client,this);
    }
}

module.exports = AutoConnect;