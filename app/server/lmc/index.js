const mcp = require('minecraft-protocol');
const Position = require('./position');
const EventEmitter = require('events').EventEmitter;
const AutoRevive = require('./plugins/autorevive');
const Autofish = require('./plugins/autofish');
const Inventory = require('./plugins/inventory');
const Entities = require('./plugins/entities');
const AutoAttack = require('./plugins/autoattack');
const AutoConnect = require('./plugins/autoconnect');

function bindEvent(client) {
    //记录玩家实体id
    client.on('login', function(packet) {
        client.playerEntityId = packet.entityId;
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

    if (client._client && client._client.wait_connect) {
        next();
    }
    else {
        client.once('connect_allowed',next);
    }

    function next() {
        const version = require('minecraft-data')(client._client.version).version;
        if (client.supportVersion.indexOf(version.majorVersion) === -1) {
            client.emit('lmc:error',{message:'不支持的服务器版本'});
            return;
        }
        client.version = version;
        // console.log('version:',version,client._client.version)
    }
}

class LinTxMinecraftClient extends EventEmitter{
    constructor (option) {
        super();
        this.supportVersion = require('./supportversion');
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
        this.autofish = new Autofish(this,1,60);
        this.autorevive = new AutoRevive(this);
        this.autoattack = new AutoAttack(this);
        this.autoconnect = new AutoConnect(this);
    }

    connect (option) {
        const self = this;
        if (!option) {
            option = self.option
        }
        else {
            self.option = option;
        }
        if (option.password === null) {
            self.username = option.username;
        }
        self._client = mcp.createClient(option);

        var oldEmit = self._client.emit;
        self._client.emit = function (event) {
            var args = Array.prototype.slice.call(arguments,1),newArgs = [event].concat(args);
            oldEmit.apply(self._client,newArgs);
            self.emit.apply(self,newArgs);

            // console.log("event:",event,args);
        };
    }

    write (name,data) {
        if (this._client && this._client instanceof EventEmitter){
            this._client.write(name,data);
        }
    }
}


module.exports = LinTxMinecraftClient;