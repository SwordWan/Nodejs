var ERR_CODE_BASE = 10000;

exports.ErrorCodes = {
    ERR_NOERROR: 0,

    ERR_INVOKE_FALIED: 1,           // 操作失败
    ERR_INVALIDARGS: 2,             // 参数错误
    ERR_NOTEXISTSREQDATA: 3,        // 请求的数据不存在
    ERR_GAMESERVERNOTRUN: 4,        // 游戏服务器未启动
    ERR_GAMESERVERISPAUSE: 5,       // 服务器维护中
    ERR_GAMESERVERISNOTEXISTS: 6,   // 游戏不存在
    ERR_INVALIDROOMPRIKEY: 7,       // 房间密钥校验失败
    ERR_NOHAVEADMINUSER: 8,         // 不存在该管理员
    ERR_INVALIDPASSWORD: 9,         // 无效密码

    ERR_ROOMISEXISTS: ERR_CODE_BASE + 1,            // 房间已存在
    ERR_ROOMNUMISFULL: ERR_CODE_BASE + 2,           // 可以创建的房间数已达上限
    ERR_ROOMCARDNOTEN: ERR_CODE_BASE + 3,           // 房卡数量不足
    ERR_INVALIDUSERID: ERR_CODE_BASE + 4,           // 非法用户ID
    ERR_INVALIDROOMID: ERR_CODE_BASE + 5,           // 非法房间ID
    ERR_INVALIDGAMETYPE: ERR_CODE_BASE + 6,         // 非法游戏类型
    ERR_ROOMISNOTEXISTS: ERR_CODE_BASE + 7,         // 房间不存在
    ERR_ISNOTROOMCREATOR: ERR_CODE_BASE + 8,        // 你不是房主
    ERR_ISINOTHERROOM: ERR_CODE_BASE + 9,           // 不能同时进行两个不同的房间
    ERR_NOTEXISTSUSER: ERR_CODE_BASE + 10,          // 用户不存在
    ERR_NOTEXISTSACCOUNT: ERR_CODE_BASE + 11,       // 账号不存在
    ERR_CREATEUSERFAILED: ERR_CODE_BASE + 12,       // 用户创建失败
    ERR_USERISEXISTS: ERR_CODE_BASE + 13,           // 用户已存在
    ERR_CREATEROOMFALIED: ERR_CODE_BASE + 14,       // 创建房间失败
    ERR_EXISTSACCOUNT: ERR_CODE_BASE + 15,          // 账号已存在/
    ERR_GETWEIXINTOKENFALIED: ERR_CODE_BASE + 16,   // 获取微信 TOKEN 失败
    ERR_ROOMPLAYERISFULL: ERR_CODE_BASE + 17,       // 房间人数已满
    ERR_GOLDSISNOTEN: ERR_CODE_BASE + 18,           // 金币不够
    ERR_CREATEUSERFALIED: ERR_CODE_BASE + 19,       // 创建用户失败
    ERR_NOTEXISTSMESSAGE: ERR_CODE_BASE + 20,       // 消息不存在
    ERR_HAVENORIGHTENTERROOM: ERR_CODE_BASE + 21,   // 没有权限进入此房间
    ERR_ISNOTBINDWITHAGENT: ERR_CODE_BASE + 22,     // 未与该群主绑定，请联系群主
    ERR_ISNOTEXISTSAGENT: ERR_CODE_BASE + 23,       // 代理不存在
    ERR_LOGINTOKENTIMEOUT: ERR_CODE_BASE + 24,      // 登录 token 超时
    ERR_USERISLOCKED: ERR_CODE_BASE + 25,           // 用户被锁定
    ERR_HAVENORIGHTCREATEHALL: ERR_CODE_BASE + 26,       // 没有创建游戏俱乐部的权限
    ERR_APPCFGFILEISNOTEXISTS: ERR_CODE_BASE + 27,       // 系统配置参数错误
    ERR_HALLNUMISFULL: ERR_CODE_BASE + 28,               // 你创建的游戏俱乐部数已达上限
    ERR_CREATEGHALLFALIED: ERR_CODE_BASE + 29,           // 创建的游戏俱乐部失败
    ERR_ISLINKGAMEHALL: ERR_CODE_BASE + 30,              // 已经加入该游戏俱乐部
    ERR_LINKGAMEHALLNUMISFULL: ERR_CODE_BASE + 31,       // 加入的游戏俱乐部数已达上限
    ERR_GAMEHALLISNOTEXISTS: ERR_CODE_BASE + 32,         // 该游戏俱乐部不存在
    ERR_NOLINKGAMEHALL: ERR_CODE_BASE + 33,              // 你没有加入该游戏俱乐部
    ERR_USERISNOTINTHEROOM: ERR_CODE_BASE + 34,          // 用户没有在游戏中房间
    ERR_YAZHUGOLDISOVERFLOW: ERR_CODE_BASE + 35,         // 押注金币超过上限
    ERR_WAITPREVACTIONREQ: ERR_CODE_BASE + 36,           // 不能连续发起相同请求，请等待前一请求完成
    ERR_INVALIDGAMEHALLID: ERR_CODE_BASE + 37,           // 无效游戏俱乐部ID
    ERR_ROOMPWDISERROR: ERR_CODE_BASE + 38,              // 房间密码错误
    ERR_ROOMSEEPOSISFULL: ERR_CODE_BASE + 39,            // 观战位已满
    ERR_ROOMTHEPOSISUSED: ERR_CODE_BASE + 40,            // 此位置已经有人了
    ERR_NOHAVEQTTIMES: ERR_CODE_BASE + 41,               // 没有可用的抢红包次数
    ERR_ISEXISTSYQUSER: ERR_CODE_BASE + 42,              // 已设置了邀请人
    ERR_NOTEXISTSREDPACKED: ERR_CODE_BASE + 43,          // 红包不存在或已被抢完
    ERR_QREDPTIMEEND: ERR_CODE_BASE + 44,                // 本轮红包时间已结束
    ERR_NOALLOWSEEPLAYER: ERR_CODE_BASE + 45,            // 不允许观战
    ERR_INVALIDJIAZHUGOLDMUL: ERR_CODE_BASE + 46,        // 无效加注金币
    ERR_INVALID_YAZHUMUL: ERR_CODE_BASE + 47,            // 无效押注倍数
    ERR_INVALID_YAZHUGOLDS: ERR_CODE_BASE + 48,          // 无效押注金币
    ERR_ISEXISTSTJUSER: ERR_CODE_BASE + 49,              // 已设置了推荐人
    ERR_CREATEROOMGOLDFALIED: ERR_CODE_BASE + 50,   // 创建房间金币不够
    ERR_CREATEROOMGOLDERROR: ERR_CODE_BASE + 51,         // 创建房间入场金币不够
    ERR_CANNOTBIPAI: ERR_CODE_BASE + 52,                 // 不能够比牌
    ERR_INVALID_YZPOSITION: ERR_CODE_BASE + 53,          // 无效押注位置
    ERR_ROOMISPLAYING: ERR_CODE_BASE + 54,               // 没有找到可用的空闲房间
    ERR_GETWEIXINSQCS: ERR_CODE_BASE + 55,               // 微信授权超时，请重新授权
    ERR_CANNOTSDYAZHU: ERR_CODE_BASE + 56,               // 当前是自动押注模式,不可以自行押注
    ERR_NOTEXISTSYAZHU: ERR_CODE_BASE + 57,              // 自动押注前请先手动押注
    ERR_BANKGOLDISNOTEN: ERR_CODE_BASE + 58,             // 金豆余额不足,请充值或存入保险柜后充值！
    ERR_JURISDICTIONNOTEN: ERR_CODE_BASE + 59,           // 权限不足      



}