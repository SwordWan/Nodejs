module.exports = {
	tb_myzj_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_myzj_logs" ("uid","clubid","roomid","userid","roomargs","jiesuan","ctime","playtimes","roomuuid") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
		return await conn.Query(sql, [row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid]);
	},
	tb_myzj_logs_update: async function (conn ,row) {
		let sql ='update "tb_myzj_logs" set "uid"=$1,"clubid"=$2,"roomid"=$3,"userid"=$4,"roomargs"=$5,"jiesuan"=$6,"ctime"=$7,"playtimes"=$8,"roomuuid"=$9';
		return await conn.Query(sql, [row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid]);
	},
	tb_myzj_logs_select: async function(conn ,row) {
		let sql ='select "uid","clubid","roomid","userid","roomargs","jiesuan","ctime","playtimes","roomuuid" from "tb_myzj_logs"';
		// row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_myzj_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_myzj_logs"';
		// row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid
		return await conn.Query(sql, []);
	},
	tb_myzj_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_myzj_logs"';
		// row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_myzj_logs_list: async function(conn ,row) {
		let sql ='select "uid","clubid","roomid","userid","roomargs","jiesuan","ctime","playtimes","roomuuid" from "tb_myzj_logs" limit $1 offset $2';
		// row.uid,row.clubid,row.roomid,row.userid,row.roomargs,row.jiesuan,row.ctime,row.playtimes,row.roomuuid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}