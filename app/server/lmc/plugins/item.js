class Item {
    constructor(data){
        this.present = false;
        this.id = 0;
        this.count = 0;
        this.nbt = null;

        if (typeof data === "object") {
            if (data.present === true) {
                this.present = true;
                this.id = data.itemId;
                this.count = data.itemCount;
                this.nbt = data.nbtData;
            }
        }
    }
}

module.exports = Item;