module.exports = {
	tb_issue_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_issue_logs" ("uid","sender","golds","ctime","recver","clubid","ymd") values ($1,$2,$3,$4,$5,$6,$7)';
		return await conn.Query(sql, [row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd]);
	},
	tb_issue_logs_update: async function (conn ,row) {
		let sql ='update "tb_issue_logs" set "uid"=$1,"sender"=$2,"golds"=$3,"ctime"=$4,"recver"=$5,"clubid"=$6,"ymd"=$7';
		return await conn.Query(sql, [row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd]);
	},
	tb_issue_logs_select: async function(conn ,row) {
		let sql ='select "uid","sender","golds","ctime","recver","clubid","ymd" from "tb_issue_logs"';
		// row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_issue_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_issue_logs"';
		// row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd
		return await conn.Query(sql, []);
	},
	tb_issue_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_issue_logs"';
		// row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_issue_logs_list: async function(conn ,row) {
		let sql ='select "uid","sender","golds","ctime","recver","clubid","ymd" from "tb_issue_logs" limit $1 offset $2';
		// row.uid,row.sender,row.golds,row.ctime,row.recver,row.clubid,row.ymd
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}