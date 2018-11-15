const Entities = require('../helper/entities');
const AutoAttackModule = require('../../server/model/linkmodule').AutoAttackConfig;

function bindEvent(client, autoattack) {
    client.on('update_time',function (packet) {
        if (autoattack.config.open) {
            autoattack.autoAttack();
        }
    });
}

class AutoAttack {
    constructor(client,config){
        this._config = new AutoAttackModule();
        this.config = config;
        this.client = client;
        const self = this;

        // bindEvent(client,this);
        setInterval(()=>{
            if (self.client.isConnect && self.config.open) {
                self.autoAttack();
            }
        },600);
    }

    attack(target){
        this.client.write('arm_animation',{hand:0});
        if (target && target instanceof Entities.Entitie) {
            this.client.write('use_entity',{
                target:target.id,
                mouse:1,
                x:target.position.x,
                y:target.position.y,
                z:target.position.z
            });
        }
    }

    autoAttack(){
        let best;
        let bestDist;
        let id;
        const self = this;
        for (id in this.client.entities.entities) {
            let entity = self.client.entities.entities[id];
            if (entity.id === self.client.playerEntityId) continue;
            let eyaw = entity.calcYaw(self.client.position);
            let i = Math.abs(eyaw - self.client.position.yaw);
            i = i > 180 ? 360 - i : i;
            if (i <= self.config.yaw / 2) {
                let dist = entity.position.distanceTo(self.client.position);
                if ((self.config.dist <= 0 || (self.config.dist > 0 && dist <= self.config.dist)) && ( !best || dist < bestDist)) {
                    best = entity;
                    bestDist = dist;
                }
            }
        }
        self.attack(best);
    }

    /**
     * 485：木剑
     * 489：石剑
     * 484：铁剑
     * 493:钻石剑
     * @returns {boolean}
     */
    autoSelectSword(){
        const self = this;
        if (!this.client || !this.client.version || this.client.version.version <= 393) {
            return;
        }
        var items = self.client.inventory.getHeldItems();
        let bestSwordSlot = -1;
        let bestSword = -1;
        let swords = [485,489,484,493];
        for (let i = 0, count = items.length; i < count; i++) {
            let index = swords.indexOf(items[i].id);
            if (index>=0) {
                if (!bestSwordSlot || index>bestSword){
                    bestSwordSlot = i;
                    bestSword = index;
                }
            }
        }
        if (swords.indexOf(self.client.inventory.getHeldItem().id) < bestSword) {
            self.client.emit('lmc:plugin',{plugin:'autoattack',message:'检测到更好的武器，切换武器'});
            self.client.inventory.setHeldItem(bestSwordSlot);
        }
    }

    set config(_config){
        if (!(_config instanceof AutoAttackModule)) {
            _config = new AutoAttackModule()
        }
        if ((!this._config || !this._config.open) && _config.open){
            this.autoSelectSword();
        }
        this._config = _config;
    }

    get config(){
        return this._config;
    }

    start (){
        this.client.emit('lmc:plugin',{plugin:'autoattack',message:`开始自动攻击，攻击角度：${this.config.yaw}，攻击距离：${this.config.dist}`});
        this.autoSelectSword();
        this.config.open = true;
    }

    stop (){
        this.client.emit('lmc:plugin',{plugin:'autoattack',message:'停止自动攻击'});
        this.config.open = false;
    }
}

module.exports = AutoAttack;