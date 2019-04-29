var AppConfigs = require("./configs_win");
var dbCC = require("./Utils/pgsqlCC");
var dbLGQ = require("./Utils/dbLGQ");
var SysUtils = require("./Utils/SysUtils");

dbCC.init(AppConfigs.database());
dbLGQ.Init(dbCC);

async function CreateNPC(iCount, iClubId) {
    var tmNow = new Date();
    var szAccount = SysUtils.GenRandCodes(6) + tmNow.getTime().toString();

    for (var iIndex = 0; iIndex < iCount; ++iIndex) {
        await dbLGQ.create_account(szAccount + iIndex.toString(), szAccount, "", false);

        var pUserInfo = await dbLGQ.get_account_info(szAccount + iIndex.toString());
        if (pUserInfo == null) continue;

        await dbLGQ.update_last_logintime(pUserInfo.userid);
        
        var szSql = "insert into tb_joinclubs(userid, clubid ,status) values($1, $2, 1)";
        var pRes = await dbCC.query(szSql, [pUserInfo.userid, iClubId]);
        if (pRes.rowCount == 0) continue;

        szSql = "update tb_clubs set unums = unums + 1 where clubid = $1";
        await dbCC.query(szSql, [iClubId]);
    }
}

async function MainEntry() {
    // await CreateNPC(618, 455435);   // 旋之家
    // await CreateNPC(500, 204597);   // 至尊俱乐部
    // await CreateNPC(500, 722502);   // 双刀风云
    // await CreateNPC(700, 346234);   // 成都璇
    // await CreateNPC(100, 184931);
}


MainEntry();