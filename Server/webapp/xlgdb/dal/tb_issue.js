module.exports = {
	tb_issue_add: async function (conn ,row) {
		let sql ='insert into "tb_issue" ("clubid","ym","dt","ctime") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.clubid,row.ym,row.dt,row.ctime]);
	},
	tb_issue_update: async function (conn ,row) {
		let sql ='update "tb_issue" set "clubid"=$1,"ym"=$2,"dt"=$3,"ctime"=$4';
		return await conn.Query(sql, [row.clubid,row.ym,row.dt,row.ctime]);
	},
	tb_issue_select: async function(conn ,row) {
		let sql ='select "clubid","ym","dt","ctime" from "tb_issue"';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_issue_delete: async function (conn ,row) {
		let sql ='delete from "tb_issue"';
		// row.clubid,row.ym,row.dt,row.ctime
		return await conn.Query(sql, []);
	},
	tb_issue_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_issue"';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_issue_list: async function(conn ,row) {
		let sql ='select "clubid","ym","dt","ctime" from "tb_issue" limit $1 offset $2';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}