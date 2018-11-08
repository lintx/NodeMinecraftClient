var mcp = require('minecraft-protocol');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var client = mcp.createClient({
    host: "127.0.0.1",   // optional
    port: 25565,         // optional
    username: "travis@sarbin.net",
    password: "k4t4t0n1k",
});


/**
 * entity
 * @param id
 * @constructor
 */
function Entity(id) {
    EventEmitter.call(this);
    this.id = id;
    this.type = null;
    this.position = new Vec3(0, 0, 0);
    this.velocity = new Vec3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = true;
    this.height = 0;
    this.effects = {};
    // 0 = held item, 1-4 = armor slot
    this.equipment = new Array(5);
    this.heldItem = this.equipment[0]; // shortcut to equipment[0]
    this.isValid = true;
    this.metadata = [];
}
util.inherits(Entity, EventEmitter);

Entity.prototype.setEquipment = function(index, item) {
    this.equipment[index] = item;
    this.heldItem = this.equipment[0];
};

/**
 * vec3
 */
var re = /\((-?[.\d]+), (-?[.\d]+), (-?[.\d]+)\)/;

function Vec3(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

function v(x, y, z) {
    if (x == null) {
        return new Vec3(0, 0, 0);
    } else if (Array.isArray(x)) {
        return new Vec3(parseFloat(x[0], 10), parseFloat(x[1], 10), parseFloat(x[2], 10));
    } else if (typeof x === 'object') {
        return new Vec3(parseFloat(x.x, 10), parseFloat(x.y, 10), parseFloat(x.z, 10));
    } else if (typeof x === 'string' && y == null) {
        var match = x.match(re);
        if (match) {
            return new Vec3(
                parseFloat(match[1], 10),
                parseFloat(match[2], 10),
                parseFloat(match[3], 10));
        } else {
            throw new Error("vec3: cannot parse: " + x);
        }
    } else {
        return new Vec3(parseFloat(x, 10), parseFloat(y, 10), parseFloat(z, 10));
    }
}

Vec3.prototype.set = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
};

Vec3.prototype.update = function(other) {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
    return this;
};

Vec3.prototype.floored = function() {
    return new Vec3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
};

Vec3.prototype.floor = function() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);
    return this;
};

Vec3.prototype.offset = function(dx, dy, dz) {
    return new Vec3(this.x + dx, this.y + dy, this.z + dz);
};
Vec3.prototype.translate = function(dx, dy, dz) {
    this.x += dx;
    this.y += dy;
    this.z += dz;
    return this;
};
Vec3.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
};
Vec3.prototype.subtract = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
};
Vec3.prototype.plus = function(other) {
    return this.offset(other.x, other.y, other.z);
};
Vec3.prototype.minus = function(other) {
    return this.offset(-other.x, -other.y, -other.z);
};
Vec3.prototype.scaled = function(scalar) {
    return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
};
Vec3.prototype.abs = function() {
    return new Vec3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
};
Vec3.prototype.volume = function() {
    return this.x * this.y * this.z;
};
Vec3.prototype.modulus = function(other) {
    return new Vec3(
        euclideanMod(this.x, other.x),
        euclideanMod(this.y, other.y),
        euclideanMod(this.z, other.z));
};
Vec3.prototype.distanceTo = function(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;
    var dz = other.z - this.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
Vec3.prototype.equals = function(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
};
Vec3.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ", " + this.z + ")";
};
Vec3.prototype.clone = function() {
    return this.offset(0, 0, 0);
};
Vec3.prototype.min = function(other) {
    return new Vec3(Math.min(this.x, other.x), Math.min(this.y, other.y), Math.min(this.z, other.z));
};
Vec3.prototype.max = function(other) {
    return new Vec3(Math.max(this.x, other.x), Math.max(this.y, other.y), Math.max(this.z, other.z));
};

function euclideanMod(numerator, denominator) {
    var result = numerator % denominator;
    return result < 0 ? result + denominator : result;
}

var entity;
var entitys;
client.once('login', function(packet) {
    // login
    console.log('login:',packet)
    entity = new Entity(packet.entityId)
    // entity.username = bot.username
    entity.type = 'player'
})

client.on('chat', function(packet) {
    // Listen for chat messages and echo them back.
    var jsonMsg = JSON.parse(packet.message);
    // console.log("on chat",jsonMsg);

    if(jsonMsg.translate == 'chat.type.announcement' || jsonMsg.translate == 'chat.type.text' || jsonMsg.translate == 'commands.message.display.incoming') {
        var username = jsonMsg.with[0].text;
        var msg = jsonMsg.with[1].text;
        // console.log("user:",username,"msg:",msg);
        if(username === client.username) return;
        // client.write('chat', {message: msg});
    }
    // console.log("on chat packet",packet);
    // if ((jsonMsg.hasOwnProperty("extra") && Array.isArray(jsonMsg.extra) && jsonMsg.extra.length>0 && typeof jsonMsg.extra[0] == 'object' && jsonMsg.extra[0].hasOwnProperty("text") && jsonMsg.extra[0].text == '<LinTx> 1')
    // || (jsonMsg.hasOwnProperty("translate") && jsonMsg.translate=='chat.type.announcement' && jsonMsg.with[0].text=="Server" && jsonMsg.with[1].text=="1")) {
    //     client.write('use_item',{hand:0});
    // }
    if (jsonMsg.hasOwnProperty("extra") && Array.isArray(jsonMsg.extra) && jsonMsg.extra.length>0 && typeof jsonMsg.extra[0] == 'object' && jsonMsg.extra[0].hasOwnProperty("text")) {
        var m = jsonMsg.extra[0].text;
        if (m.substr(0, 7) == "<LinTx>") {
            var t = m.substr(8);
            switch (t) {
                case "1":
                    console.log("use_item")
                    client.write('use_item',{hand:0});
                    break;
                case "2":
                    console.log("held_item_slot")
                    client.write('held_item_slot',{slotId:0});
                    break;
                case "3":
                    console.log("arm_animation")
                    client.write('arm_animation', { hand: 0 })
                    client.write('use_entity', {
                        target: 0,
                        mouse: 1
                    })
                    break;
            }
        }
    }
});
client.on('position',function (packet) {
    // var jsonMsg = JSON.parse()
    // console.log('onpositon',packet);
});
client.on('update_health', function (packet) {
    console.log(packet);
    if (packet.health <= 0) {
        client.write('client_command', { payload: 0 })
    }
});

var fishentityid = 0;
client.on('entity_teleport',function (packet) {
    if (packet.entityId) {
        fishentityid = packet.entityId;
        client.write('teleport_confirm',{teleportId:packet.entityId})
    }
});
client.on('sound_effect',function (packet) {
    if (packet.soundId) {
        var sid = packet.soundId;
        if (sid != 290) {
            console.log("sound_effect:",packet);
        }
    }
});


var oldEmit = client.emit;
client.emit = function (event) {
    var args = Array.prototype.slice.call(arguments,1),newArgs = [event].concat(args);
    oldEmit.apply(client,newArgs);

    if (event.indexOf('raw')==0){
        return;
    }
    if (Array.isArray(args) && args.length > 0) {
        var p = args[0];
        if (typeof p == "object" && p.hasOwnProperty("entityId")) {
            var i = p.entityId;
            if (i == fishentityid) {
                console.log('on event:',event,'args:',args);
            }
        }
    }
    var igone = [
        "raw","packet","update_time","map_chunk","raw.map_chunk","raw.update_time"
    ];
    var see = [
        "entity_metadata","spawn_entity","entity_move_look"
    ];
    if (igone.indexOf(event) == -1){

        if (see.indexOf(event) != -1) {
            if (event == "entity_metadata") {
                // console.log("entity_metadata:",JSON.stringify(args));
            }
            else {

                // console.log('on see event:',event,'args:',args);
            }
        }
        else {
            // console.log('on igone event:',event,'args:',args);
        }
    }
    if (event == "spawn_entity" && Array.isArray(args) && args.length>0 && typeof args[0]=="object" && args[0].hasOwnProperty("type") && args[0].type==90) {
        // console.log('on see event:',event,'args:',args);
    }
    if (event == "named_sound_effect") {
        // console.log("named_sound_effect:",args);
    }
    if (event == "sound_effect") {
        // console.log("sound_effect:",args);
    }
};