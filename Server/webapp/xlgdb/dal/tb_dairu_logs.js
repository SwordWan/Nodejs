module.exports = {
	tb_dairu_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_dairu_logs" ("uid","userid","clubid","ctime","ymd","alias","golds") values ($1,$2,$3,$4,$5,$6,$7)';
		return await conn.Query(sql, [row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds]);
	},
	tb_dairu_logs_update: async function (conn ,row) {
		let sql ='update "tb_dairu_logs" set "uid"=$1,"userid"=$2,"clubid"=$3,"ctime"=$4,"ymd"=$5,"alias"=$6,"golds"=$7';
		return await conn.Query(sql, [row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds]);
	},
	tb_dairu_logs_select: async function(conn ,row) {
		let sql ='select "uid","userid","clubid","ctime","ymd","alias","golds" from "tb_dairu_logs"';
		// row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_dairu_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_dairu_logs"';
		// row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds
		return await conn.Query(sql, []);
	},
	tb_dairu_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_dairu_logs"';
		// row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_dairu_logs_list: async function(conn ,row) {
		let sql ='select "uid","userid","clubid","ctime","ymd","alias","golds" from "tb_dairu_logs" limit $1 offset $2';
		// row.uid,row.userid,row.clubid,row.ctime,row.ymd,row.alias,row.golds
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}