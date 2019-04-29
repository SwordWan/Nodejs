module.exports = {
	tb_paijuhuigu_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_paijuhuigu_logs" ("uid","roomuuid","roomid","jsonvals","ctime","playtimes") values ($1,$2,$3,$4,$5,$6)';
		return await conn.Query(sql, [row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes]);
	},
	tb_paijuhuigu_logs_update: async function (conn ,row) {
		let sql ='update "tb_paijuhuigu_logs" set "uid"=$1,"roomuuid"=$2,"roomid"=$3,"jsonvals"=$4,"ctime"=$5,"playtimes"=$6';
		return await conn.Query(sql, [row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes]);
	},
	tb_paijuhuigu_logs_select: async function(conn ,row) {
		let sql ='select "uid","roomuuid","roomid","jsonvals","ctime","playtimes" from "tb_paijuhuigu_logs"';
		// row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_paijuhuigu_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_paijuhuigu_logs"';
		// row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes
		return await conn.Query(sql, []);
	},
	tb_paijuhuigu_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_paijuhuigu_logs"';
		// row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_paijuhuigu_logs_list: async function(conn ,row) {
		let sql ='select "uid","roomuuid","roomid","jsonvals","ctime","playtimes" from "tb_paijuhuigu_logs" limit $1 offset $2';
		// row.uid,row.roomuuid,row.roomid,row.jsonvals,row.ctime,row.playtimes
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}