module.exports = {
	tb_alliance_jiangchi_add: async function (conn, row) {
		let sql = 'insert into "tb_alliance_jiangchi" ("allianceid","golds","tianhuang","duohuang","duoduoduo","level","userid") values ($1,$2,$3,$4,$5,$6,$7)';
		return await conn.Query(sql, [row.allianceid, row.golds, row.tianhuang, row.duohuang, row.duoduoduo, row.level, row.userid]);
	},
	tb_alliance_jiangchi_update: async function (conn, row) {
		let sql = 'update "tb_alliance_jiangchi" set "allianceid"=$1,"golds"=$2,"tianhuang"=$3,"duohuang"=$4,"duoduoduo"=$5,"level"=$6,"userid"=$7';
		return await conn.Query(sql, [row.allianceid, row.golds, row.tianhuang, row.duohuang, row.duoduoduo, row.level, row.userid]);
	},
	tb_alliance_jiangchi_select: async function (conn, row) {
		let sql = 'select "uid","allianceid","golds","tianhuang","duohuang","duoduoduo","level","userid" from "tb_alliance_jiangchi"';
		// row.allianceid,row.golds,row.tianhuang,row.duohuang,row.duoduoduo
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_alliance_jiangchi_delete: async function (conn, row) {
		let sql = 'delete from "tb_alliance_jiangchi"';
		// row.allianceid,row.golds,row.tianhuang,row.duohuang,row.duoduoduo
		return await conn.Query(sql, []);
	},
	tb_alliance_jiangchi_count: async function (conn, row) {
		let sql = 'select count(*) as total from "tb_alliance_jiangchi"';
		// row.allianceid,row.golds,row.tianhuang,row.duohuang,row.duoduoduo
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_alliance_jiangchi_list: async function (conn, row) {
		let sql = 'select "uid","allianceid","golds","tianhuang","duohuang","duoduoduo","level","userid" from "tb_alliance_jiangchi" limit $1 offset $2';
		// row.allianceid,row.golds,row.tianhuang,row.duohuang,row.duoduoduo
		let res = await conn.Query(sql, [row.size, (row.page - 1) * row.size]);
		return res.rows;
	},
	tb_alliance_jiangchi_by_allianceid: async function (conn, allianceid) {
		let sql = 'select "uid","allianceid","golds","tianhuang","duohuang","duoduoduo","level","userid" from "tb_alliance_jiangchi" where "allianceid"=$1 order by "level" asc';
		// row.allianceid,row.golds,row.tianhuang,row.duohuang,row.duoduoduo
		let res = await conn.Query(sql, [allianceid]);
		return res.rows;
	},
	tb_alliance_jiangchi_update_by_allianceid_level: async function (conn, row) {
		let sql = 'update "tb_alliance_jiangchi" set "golds"=$1,"tianhuang"=$2,"duohuang"=$3,"duoduoduo"=$4 where "allianceid"=$5 and "level"=$6';
		return await conn.Query(sql, [row.golds, row.tianhuang, row.duohuang, row.duoduoduo, row.allianceid, row.level]);
	},
	tb_alliance_jiangchi_update_by_allianceid_level_1: async function (conn, row) {
		let sql = 'update "tb_alliance_jiangchi" set "tianhuang"=$1,"duohuang"=$2,"duoduoduo"=$3 where "allianceid"=$4 and "level"=$5';
		return await conn.Query(sql, [row.tianhuang, row.duohuang, row.duoduoduo, row.allianceid, row.level]);
	},
}