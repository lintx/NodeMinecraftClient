const AutoModule = require('../../server/model/linkmodule').AutoChat;
const AutoModuleMode = require('../../server/model/linkmodule').AutoChatMode;

let lastTimes = {};
function getLastTime(index){
    if (!lastTimes.hasOwnProperty(index)) {
        lastTimes[index] = 0;
    }
    return lastTimes[index];
}
function setLastTime(index,time) {
    lastTimes[index] = time;
}

function bindEvent(client, autochat) {
    function sendChat(chat) {
        client.write('chat',{message: chat});
    }

    client.on('connect', function (packet) {
        autochat.isConnect = true;
    });
    client.on('disconnect', function (packet) {
        autochat.isConnect = false;
    });
    client.on('kick_disconnect', (packet)=>{
        autochat.isConnect = false;
    });
    client.on('update_time',function (packet) {
        var time = Date.now();
        if (autochat.config.open) {
            autochat.config.chats.forEach((chat,index)=>{
                if (chat instanceof AutoModuleMode && chat.open && chat.chat.length>0) {
                    let last = getLastTime(index);
                    if (last === 0) {
                        sendChat(chat.chat);
                        setLastTime(index,time);
                    }
                    else if (chat.mode === 1) {
                        if (last + chat.time * 1000 <= time) {
                            sendChat(chat.chat);
                            setLastTime(index,time);
                        }
                    }
                }
            });
        }
    });
}
class AutoChat {
    constructor(client,config){
        if (!(config instanceof AutoModule)) {
            config = new AutoModule()
        }
        this.config = config;
        this.client = client;
        this.isConnect = false;

        bindEvent(client,this);
    }

    updateConfig(config){
        if (!(config instanceof AutoModule)) {
            config = new AutoModule()
        }
        this.config = config;
        lastTimes = {};
    }
}

module.exports = AutoChat;