const mcp = require('minecraft-protocol');
const Position = require('./helper/position');
const EventEmitter = require('events').EventEmitter;
const AutoFevive = require('./plugins/autorevive');
const Autofish = require('./plugins/autofish');
const Inventory = require('./helper/inventory');
const Entities = require('./helper/entities');
const AutoAttack = require('./plugins/autoattack');
const AutoConnect = require('./plugins/autoconnect');
const AutoChat = require('./plugins/autochat');

function bindEvent(client) {
    //记录玩家实体id
    client.on('login', function(packet) {
        client.playerEntityId = packet.entityId;
        client.username = client._client.username;
    });

    //记录玩家坐标
    client.on('position',function (packet) {
        client.position = new Position(packet.x,packet.y,packet.z,packet.yaw,packet.pitch);
    });

    client.on('error',function (err) {
        // console.log(err.message)
    });

    client.on('session',(session)=>{
        // console.log("session:",session,client._client)
        //这里要发通知让服务器存储session，以便下次使用，登录时如果有session应传入，会自动优先使用session
    });

    client.on('connect', function (packet) {
        client.isConnect = true;
        client.emit('lmc:connect');
    });
    client.on('disconnect', function (packet) {
        client.isConnect = false;
        client.emit('lmc:disconnect',packet);
    });
    client.on('kick_disconnect', (packet)=>{
        client.isConnect = false;
        client.emit('lmc:disconnect',packet);
    });
    client.on('end',(packet)=>{
        client.isConnect = false;
        client.emit('lmc:disconnect');
    });
}

class LinTxMinecraftClient extends EventEmitter{
    constructor (option) {
        super();
        this.supportVersion = require('./supportversion');
        this.isConnect = false;
        this.option = option || {};
        this._client = null;
        this.version = null;
        this.username = "";

        this.playerEntityId = 0;
        this.position = new Position();

        const self = this;

        bindEvent(this);

        this.inventory = new Inventory(this);
        this.entities = new Entities.Entities(this);
        this.autofish = new Autofish(this);
        this.autofevive = new AutoFevive(this);
        this.autoattack = new AutoAttack(this);
        this.autoconnect = new AutoConnect(this);
        this.autochat = new AutoChat(this);
    }

    end(){
        if (this._client) {
            this._client.end();
            this._client = null;
        }
    }

    connect (option) {
        const self = this;
        if (!option) {
            option = self.option
        }
        else {
            self.option = option;
        }
        if (!option.username || !option.host || !option.port) {
            this.emit('lmc:error',{message:'用户名或服务器地址或服务器端口为空，无法连接'});
            return;
        }
        if (option.password === null) {
            self.username = option.username;
        }

        if (option.version) {
            const version = require('minecraft-data')(option.version).version;
            if (self.supportVersion.indexOf(version.majorVersion) === -1) {
                self.emit('lmc:error',{message:'不支持的服务器版本'});
                return;
            }
            self.version = version;
        }

        if (this._client) {
            this.end();
        }
        self._client = mcp.createClient(option);

        // var oldEmit = self._client.emit;
        // self._client.emit = function (event) {
        //     var args = Array.prototype.slice.call(arguments,1),newArgs = [event].concat(args);
        //     if (self._client) oldEmit.apply(self._client,newArgs);
        //     if (event.indexOf('raw') === -1) {
        //         self.emit.apply(self,newArgs);
        //     }
        // };
        if (self._client && self._client.wait_connect) {
            next();
        }
        else {
            self.once('connect_allowed',next);
        }

        function next() {
            const version = require('minecraft-data')(self._client.version).version;
            if (self.supportVersion.indexOf(version.majorVersion) === -1) {
                self.emit('lmc:error',{message:'不支持的服务器版本'});
                return;
            }
            self.version = version;
            // console.log('version:',version,client._client.version)
        }
    }

    write (name,data) {
        if (this._client && this._client instanceof EventEmitter){
            this._client.write(name,data);
        }
    }
}


module.exports = LinTxMinecraftClient;