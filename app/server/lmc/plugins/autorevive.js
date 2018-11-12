const AutoFeviveModule = require('../../server/model/linkmodule').AutoFevive;

function bindEvent(client, autofevive) {
    client.on('update_health', function (packet) {
        if (packet.health <= 0 && autofevive.config.open) {
            client.emit('lmc:plugin',{plugin:'autofevive',message:`玩家死亡，自动复活，死亡坐标：X:${client.position.x} Y:${client.position.y} Z:${client.position.z}`});
            client.write('client_command', { payload: 0 });
        }
    });
    // client.on('health', (packet)=>{
    //     if (autofevive.open) {
    //         client.emit('lmc:plugin',{plugin:'autofevive',message:`玩家死亡，自动复活，死亡坐标：X:${client.position.x} Y:${client.position.y} Z:${client.position.z}`});
    //         client.write('client_command', { payload: 0 });
    //     }
    // });
}

class AutoFevive {
    constructor (client,config){
        if (!(config instanceof AutoFeviveModule)) {
            config = new AutoFeviveModule()
        }
        this.config = config;
        this.client = client;
        const self = this;

        bindEvent(client,this);
    }
}

module.exports = AutoFevive;