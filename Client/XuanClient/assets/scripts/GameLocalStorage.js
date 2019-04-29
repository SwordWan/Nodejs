module.exports = {
    catchKey: "key",
    catchData: {
        userName: null,
        pwd: null,
    },
    init(){
        var saveStr = cc.sys.localStorage.getItem(this.catchKey);
        if (saveStr) {
            var saveObj = JSON.parse(saveStr);

            this.catchData.userName = saveObj.userName;
            this.catchData.pwd = saveObj.pwd;
        }
    },
    getUserName(){
        return this.catchData.userName;
    },
    getPwd(){
        return this.catchData.pwd;
    },
    setUserNameAndPwd(userName, pwd){
        this.catchData.userName = userName;
        this.catchData.pwd = pwd;
        this.save();
    },
    save(){
        var saveStr = JSON.stringify(this.catchData);
        cc.sys.localStorage.setItem(this.catchKey, saveStr);
    },
}