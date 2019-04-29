module.exports = {
    missionArr: [],
    // mission  任务
    // priority 优先级
    addMissionByPriority(mission, priority){
        this.missionArr.splice(priority, 0, mission);
    },
    addMission(mission){
        this.missionArr.push(mission);

    },
    getNextMission(){
        return 1;
    }


}