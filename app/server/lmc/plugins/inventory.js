const Item = require('./item');

/**
 * index:
 * 0-4未知
 * 5：头部
 * 6：胸部
 * 7：腿部
 * 8：脚部
 * 9-35：背包上面3行
 * 36-44：背包下面一行/可快速切换的那一行
 * 45：副手
 * @param client
 * @param inventory
 */
const QUICK_BAR_START = 36;

function bindEvent(client, inventory) {
    client.on('window_items',(packet)=>{
        let windowId = packet.windowId;
        if (windowId===0 && Array.isArray(packet.items)) {
            for (let i = 0, count = packet.items.length; i < count; i++) {
                inventory.setItem(i,packet.items[i]);
            }
        }
    });
    client.on('set_slot',(packet)=>{
        if (packet.windowId === 0) {
            inventory.setItem(packet.slot,packet.item);
        }
    });
    client.on('held_item_slot',(packet)=>{
        inventory.heldIndex = packet.slot;
    });
}

class Inventory {
    constructor(client){
        this.client = client;
        this.items = {};
        this.heldIndex = 0;

        bindEvent(client,this);
    }

    getItem(index){
        if (this.items.hasOwnProperty(index)) {
            return this.items[index];
        }
        else {
            let item = new Item();
            this.items[index] = item;
            return item;
        }
    }

    setItem(index,item){
        if (item instanceof Item) {
            this.items[index] = item;
        }
        else {
            this.items[index] = new Item(item);
        }
    }

    //0-8
    setHeldItem(index){
        // console.log("setHeldItemSlot:",index);
        this.client.write('held_item_slot',{slotId:index});
        this.heldIndex = index;
    }

    getHeldItem(){
        return this.getItem(this.heldIndex+QUICK_BAR_START);
    }

    getHeldItems(){
        var items = [];
        const self = this;
        for (let i = QUICK_BAR_START; i < QUICK_BAR_START + 9; i++) {
            items.push(self.getItem(i));
        }
        return items;
    }
}

module.exports = Inventory;