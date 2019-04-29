module.exports = {
	tb_online_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_online_logs" ("userid","clubid","roomid","ctime") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.userid,row.clubid,row.roomid,row.ctime]);
	},
	tb_online_logs_update: async function (conn ,row) {
		let sql ='update "tb_online_logs" set "userid"=$1,"clubid"=$2,"roomid"=$3,"ctime"=$4';
		return await conn.Query(sql, [row.userid,row.clubid,row.roomid,row.ctime]);
	},
	tb_online_logs_select: async function(conn ,row) {
		let sql ='select "userid","clubid","roomid","ctime" from "tb_online_logs"';
		// row.userid,row.clubid,row.roomid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_online_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_online_logs"';
		// row.userid,row.clubid,row.roomid,row.ctime
		return await conn.Query(sql, []);
	},
	tb_online_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_online_logs"';
		// row.userid,row.clubid,row.roomid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_online_logs_list: async function(conn ,row) {
		let sql ='select "userid","clubid","roomid","ctime" from "tb_online_logs" limit $1 offset $2';
		// row.userid,row.clubid,row.roomid,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}