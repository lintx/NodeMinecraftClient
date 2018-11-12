const Position = require('../helper/position');
const AutoModule = require('../../server/model/linkmodule').AutoFishConfig;

//fishing_rod itemId:
//1.13.1-1.13.2:568
//1.13:563
//1.8-1.12:346

class AutoFish {
    constructor(client,config){
        if (!(config instanceof AutoModule)) {
            config = new AutoModule()
        }
        this.config = config;
        this.fishing = false;
        this.teleportIds = [];
        this.spawnId = 0;
        this.fishEntityId = 0;
        this.client = client;
        this.lastUseTime = 0;
        this.checkEntity = false;

        const self = this;

        function bindEvent() {
            client.on('update_time',function (packet) {
                var time = Date.now();
                if (canFish()) {
                    if (self.fishing) {
                        if (self.config.timeout > 0 && time - self.lastUseTime > self.config.timeout*1000) {
                            //检测到超过时间依然在钓鱼，收杆
                            self.client.emit('lmc:plugin',{plugin:'autofish',message:`检测到超过时间(${self.config.timeout})依然在钓鱼，收杆并重新抛竿`});
                            use_fish_rod();
                        }
                    }
                    else {
                        if (time - self.lastUseTime > self.config.delay*1000) {
                            // self.client.emit('lmc:plugin',{plugin:'autofish',message:`检测到超过时间(${self.delay})没有在钓鱼，重新抛竿`});
                            //检测到超过时间没有在钓鱼，开始钓鱼
                            use_fish_rod();
                        }
                    }
                }
                else{
                    if (self.fishing) {
                        use_fish_rod();
                    }
                }
            });

            client.on('spawn_entity',function (packet) {
                if (packet.entityId && packet.type===90) {
                    self.spawnId = packet.entityId;
                    var entityPosition = new Position(packet.x,packet.y-1.6,packet.z);
                    if (client.position && client.position instanceof Position) {
                        var distance = client.position.distanceTo(entityPosition);
                        if (distance !== -1 && distance < 0.5) {
                            checkEntity();
                        }
                    }
                }
            });
            client.on('entity_teleport',function (packet) {
                if (packet.entityId) {
                    var id = packet.entityId;
                    if (self.teleportIds.indexOf(id)===-1){
                        self.teleportIds.push(id);
                        checkEntity();
                    }
                    client.write('teleport_confirm',{teleportId:packet.entityId})
                }
            });
            client.on('entity_move_look',function (packet) {
                if (packet.entityId) {
                    var id = packet.entityId;
                    if (id === self.fishEntityId) {
                        if (packet.dX===0 && packet.dZ===0 && packet.dY < -1000) {
                            use_fish_rod();
                        }
                    }
                }
            });
            client.on('entity_destroy',function (packet) {
                if (packet.entityIds) {
                    var ids = packet.entityIds;
                    if (ids.indexOf(self.fishEntityId)>-1) {
                        self.fishing = false;
                    }
                }
            });
            function checkEntity(){
                if (self.checkEntity && self.teleportIds.length > 0 && self.spawnId > 0){
                    if (self.teleportIds.indexOf(self.spawnId) > -1) {
                        self.fishEntityId = self.spawnId;
                        self.teleportIds = [];
                        self.spawnId = 0;
                        self.fishing = true;
                        self.checkEntity = false;
                    }
                }
            }
            function use_fish_rod(){
                self.lastUseTime = Date.now();
                if (!self.fishing) {
                    self.checkEntity = true;
                }
                client.write('use_item',{hand:0});
            }
            function canFish() {
                if (!self.config.open) return false;
                if (self.client.inventory.getHeldItem().id === 568) {
                    return true;
                }
                else {
                    self.client.emit('lmc:plugin',{plugin:'autofish',message:'当前选择的物品不是鱼竿，尝试切换到鱼竿'});
                    var items = self.client.inventory.getHeldItems();
                    for (let i = 0, count = items.length; i < count; i++) {
                        if (items[i].id === 568) {
                            self.client.emit('lmc:plugin',{plugin:'autofish',message:'检测到鱼竿，切换到鱼竿'});
                            self.client.inventory.setHeldItem(i);
                            return false;
                        }
                    }
                }
            }
        }
        bindEvent();
    }

    start (){
        this.client.emit('lmc:plugin',{plugin:'autofish',message:'开始自动钓鱼'});
        this.config.open = true;
    }

    stop (){
        this.client.emit('lmc:plugin',{plugin:'autofish',message:'停止自动钓鱼'});
        this.config.open = false;
    }
}
module.exports = AutoFish;