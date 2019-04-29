// 可能某些js文件需要监听某些事件,但是这个js文件并没有挂载到node上,因此没有机会注册事件,此类js文件可以放在这里注册
module.exports = {
    pool: [],
    initPool(){
        for (var k = 0; k < this.pool.length; k++) {
            var poolItem = this.pool[k];
            if (poolItem.init) {
                poolItem.init();
            } else {

            }
        }
    },
    releasePool(){

    }
}
