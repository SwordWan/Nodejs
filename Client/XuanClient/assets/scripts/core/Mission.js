module.exports = {
    priority: 0,
    cacheCondition: null,// 缓存条件
    create(missionName, callBack, priority){
        return {name: missionName};
    },


}