module.exports = {
	tb_dairu_add: async function (conn ,row) {
		let sql ='insert into "tb_dairu" ("clubid","ym","dt","ctime") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.clubid,row.ym,row.dt,row.ctime]);
	},
	tb_dairu_update: async function (conn ,row) {
		let sql ='update "tb_dairu" set "clubid"=$1,"ym"=$2,"dt"=$3,"ctime"=$4';
		return await conn.Query(sql, [row.clubid,row.ym,row.dt,row.ctime]);
	},
	tb_dairu_select: async function(conn ,row) {
		let sql ='select "clubid","ym","dt","ctime" from "tb_dairu"';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_dairu_delete: async function (conn ,row) {
		let sql ='delete from "tb_dairu"';
		// row.clubid,row.ym,row.dt,row.ctime
		return await conn.Query(sql, []);
	},
	tb_dairu_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_dairu"';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_dairu_list: async function(conn ,row) {
		let sql ='select "clubid","ym","dt","ctime" from "tb_dairu" limit $1 offset $2';
		// row.clubid,row.ym,row.dt,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}