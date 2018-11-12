function Position(x, y, z, yaw, pitch) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.yaw = yaw||0;
    this.pitch = pitch||0;
}
Position.prototype.distanceTo = function(position) {
    if (this.x === undefined || this.y === undefined || this.z === undefined || position.x === undefined || position.y === undefined || position.z === undefined) return -1;
    var distancex = position.x - this.x;
    var distancey = position.y - this.y;
    var distancez = position.z - this.z;
    return Math.sqrt(Math.pow(distancex,2) + Math.pow(distancey,2)  + Math.pow(distancez,2));
};
Position.prototype.add = function(position){
    this.x += position.x;
    this.y += position.y;
    this.z += position.z;
};
Position.prototype.move = function(position){
    const n = 128*32;
    position.x /= n;
    position.y /= n;
    position.z /= n;
    this.add(position);
};

module.exports = Position;