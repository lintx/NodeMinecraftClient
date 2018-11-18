const Position = require('./position');
const Mobs = require('minecraft-data')("1.13.2").mobs;

function bindEvent(client, entities) {
    client.on('spawn_entity_living',(packet)=>{
        entities.setEntity(packet.entityId,packet);
    });
    client.on('named_entity_spawn',(packet)=>{
        entities.setEntity(packet.entityId,packet);
    });
    client.on('rel_entity_move',(packet)=>{
        let entity = entities.getEntity(packet.entityId);
        if (entity) {
            entities.getEntity(packet.entityId).move(packet);
        }
    });
    client.on('entity_move_look',(packet)=>{
        let entity = entities.getEntity(packet.entityId);
        if (entity) {
            entities.getEntity(packet.entityId).move(packet);
        }
    });
    client.on('entity_teleport',(packet)=>{
        let entity = entities.getEntity(packet.entityId);
        if (entity) {
            entity.position = new Position(packet.x,packet.y,packet.z);
        }
    });
    client.on('entity_destroy',(packet)=>{
        packet.entityIds.forEach((id)=>{
            delete entities.entities[id];
        });
    });
}

class Entities {
    constructor(client){
        this.client = client;
        this.entities = {};

        bindEvent(client,this);
    }

    getEntity(index){
        if (this.entities.hasOwnProperty(index)) {
            return this.entities[index];
        }
        return null;
    }

    setEntity(index,entity){
        if (entity instanceof Entitie) {
            this.entities[index] = entity;
        }
        else {
            this.entities[index] = new Entitie(entity);
        }
    }
}

class Entitie{
    constructor(data){
        this.position = new Position();
        this.data = undefined;
        this.id = 0;

        if (typeof data === "object") {
            this.data = Mobs[data.type];
            this.position = new Position(data.x,data.y,data.z);
            this.id = data.entityId;
        }
    }

    move(data){
        this.position.move(new Position(data.dX,data.dY,data.dZ));
    }

    calcYaw(position){
        let yaw = (Math.atan2(this.position.z-position.z,this.position.x-position.x))*180/Math.PI;
        return yaw > -90 ? yaw - 90 : yaw + 270;
    }
}

module.exports = {
    Entitie,
    Entities
};