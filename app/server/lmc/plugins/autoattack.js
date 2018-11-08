const Entities = require('./entities');

function bindEvent(client, autoattack) {
    client.on('update_time',function (packet) {
        if (autoattack.open) {
            autoattack.autoAttack();
        }
    });
}

class AutoAttack {
    constructor(client){
        this.open = false;
        this.yaw = 120;
        this.dist = 3;
        this.client = client;

        bindEvent(client,this);
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

    autoAttack(yaw,dist){
        this.yaw = yaw || this.yaw;
        this.dist = dist || this.dist;

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
            if (i <= self.yaw / 2) {
                let dist = entity.position.distanceTo(self.client.position);
                if ((self.dist <= 0 || (self.dist > 0 && dist <= self.dist)) && ( !best || dist < bestDist)) {
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

    start (){
        this.client.emit('lmc:plugin',{plugin:'autoattack',message:`开始自动攻击，攻击角度：${this.yaw}，攻击距离：${this.dist}`});
        this.autoSelectSword();
        this.open = true;
    }

    stop (){
        this.client.emit('lmc:plugin',{plugin:'autoattack',message:'停止自动攻击'});
        this.open = false;
    }
}

module.exports = AutoAttack;