var ERR_CODE_BASE = 10000;

exports.ErrorCodes = {
    ERR_NOERROR: 0,

    ERR_INVALIDARGS: 1,             // 参数错误
    ERR_INVOKE_FALIED: 2,           // 操作失败
    ERR_DBSERVERNOTRUN: 3,          // 未找到数据服务器
    ERR_GAMESERVERNOTRUN: 4,        // 游戏服务器未启动
    ERR_INVALIDPASSWORD: 5,         // 无效密码
    ERR_DBUPDATEFALIED: 6,          // 更新数据库失败
    ERR_NOTENOUGHGOLDS: 7,          // 金币不够
    ERR_NOTENOUGHGEMS: 8,           // 钻石不够
    ERR_NOTENOUGHJIFEN: 9,          // 积分不够
    ERR_ISOTHERLOGININ: 10,         // 用户在其它位置登录了
    ERR_GETWXINFOFALIED: 11,        // 获取微信信息失败
    ERR_ERRORAUTHORITY: 12,         // 权限不够
    ERR_CLUBLEVEL: 13,              // 俱乐部等级不够
    ERR_WAITGAMEOVER: 14,           // 等待本局结束  

    ERR_CREATEACCOUNTFALIED: 1000,  // 账号创建失败
    ERR_ACCOUNTISEXISTS: 1001,      // 账号已存在
    ERR_ACCOUNTISNOTEXISTS: 1002,   // 账号不存在
    ERR_USERISEXISTS: 1002,         // 用户已存在
    ERR_USERISNOTEXISTS: 1003,      // 用户不存在
    ERR_ROOMISNOTEXISTS: 1004,      // 房间不存在
    ERR_ROOMPLAYERISFULL: 1005,     // 房间人数已满
    ERR_CLUBISNOTEXISTS: 1006,      // 俱乐部不存在
    ERR_CLUBADMINUSERISFULL: 1007,  // 俱乐部管理员人数已满
    ERR_USERCLUBNUMISFULL: 1008,    // 用户创建的俱乐部数量已达上限
    ERR_ENTERROOMFALIED: 1009,      // 进入房间失败
    ERR_INVALIDSEATINDEX: 1010,     // 无效位置
    ERR_REFUSESITDOWN: 1011,        // 管理员不同意坐位置
    ERR_ISCANNOTENTERTIME: 1012,    // 带入时间已过
    ERR_CNTDELINCROOMCLUB: 1013,    // 不能删除还有房间的俱乐部
}