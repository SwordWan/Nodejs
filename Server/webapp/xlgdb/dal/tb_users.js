module.exports = {
	tb_users_get_by_account: async function (conn, account) {
		let sql = 'select "account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount" from "tb_users" where "account" = $1 ';
		let res = await conn.Query(sql, [account]);
		return res.rows;
	},
	tb_users_add: async function (conn, row) {
		let sql = 'insert into "tb_users" ("account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)';
		return await conn.Query(sql, [row.account, row.password, row.userid, row.alias, row.sex, row.headico, row.golds, row.gems, row.levels, row.roomid, row.ctime, row.chgalias, row.clubnums, row.vipendtime, row.lastlogintime, row.extdata, row.clubid, row.roomclubid, row.mymsgcount]);
	},
	tb_users_update: async function (conn, row) {
		let sql = 'update "tb_users" set "account"=$1,"password"=$2,"userid"=$3,"alias"=$4,"sex"=$5,"headico"=$6,"golds"=$7,"gems"=$8,"levels"=$9,"roomid"=$10,"ctime"=$11,"chgalias"=$12,"clubnums"=$13,"vipendtime"=$14,"lastlogintime"=$15,"extdata"=$16,"clubid"=$17,"roomclubid"=$18,"mymsgcount"=$19';
		return await conn.Query(sql, [row.account, row.password, row.userid, row.alias, row.sex, row.headico, row.golds, row.gems, row.levels, row.roomid, row.ctime, row.chgalias, row.clubnums, row.vipendtime, row.lastlogintime, row.extdata, row.clubid, row.roomclubid, row.mymsgcount]);
	},
	tb_users_select: async function (conn, row) {
		let sql = 'select "account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount" from "tb_users"';
		// row.account,row.password,row.userid,row.alias,row.sex,row.headico,row.golds,row.gems,row.levels,row.roomid,row.ctime,row.chgalias,row.clubnums,row.vipendtime,row.lastlogintime,row.extdata,row.clubid,row.roomclubid,row.mymsgcount
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_users_delete: async function (conn, row) {
		let sql = 'delete from "tb_users"';
		// row.account,row.password,row.userid,row.alias,row.sex,row.headico,row.golds,row.gems,row.levels,row.roomid,row.ctime,row.chgalias,row.clubnums,row.vipendtime,row.lastlogintime,row.extdata,row.clubid,row.roomclubid,row.mymsgcount
		return await conn.Query(sql, []);
	},
	tb_users_count: async function (conn, row) {
		let sql = 'select count(*) as total from "tb_users"';
		// row.account,row.password,row.userid,row.alias,row.sex,row.headico,row.golds,row.gems,row.levels,row.roomid,row.ctime,row.chgalias,row.clubnums,row.vipendtime,row.lastlogintime,row.extdata,row.clubid,row.roomclubid,row.mymsgcount
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_users_list: async function (conn, row) {
		let sql = 'select "account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount" from "tb_users" limit $1 offset $2';
		// row.account,row.password,row.userid,row.alias,row.sex,row.headico,row.golds,row.gems,row.levels,row.roomid,row.ctime,row.chgalias,row.clubnums,row.vipendtime,row.lastlogintime,row.extdata,row.clubid,row.roomclubid,row.mymsgcount
		let res = await conn.Query(sql, [row.size, (row.page - 1) * row.size]);
		return res.rows;
	},
	tb_users_get_by_userid: async function (conn, userid) {
		let sql = 'select "opengps", "account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount" from "tb_users" where "userid" = $1 ';
		let res = await conn.Query(sql, [userid]);
		return res.rows;
	},
	tb_users_get_by_opengps: async function (conn, opengps) {
		let sql = 'select "opengps", "account","password","userid","alias","sex","headico","golds","gems","levels","roomid","ctime","chgalias","clubnums","vipendtime","lastlogintime","extdata","clubid","roomclubid","mymsgcount" from "tb_users" where "opengps" = $1 ';
		let res = await conn.Query(sql, [opengps]);
		return res.rows;
	},
	tb_users_update_opengps: async function (conn, userid, opengps) {
		let sql = 'update "tb_users" set "opengps"=$1 where "userid" = $2';
		return await conn.Query(sql, [opengps, userid]);
	},

}