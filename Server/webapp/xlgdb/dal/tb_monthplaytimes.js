module.exports = {
	tb_monthplaytimes_add: async function (conn ,row) {
		let sql ='insert into "tb_monthplaytimes" ("clubid","userid","playtimes","uid","ctime") values ($1,$2,$3,$4,$5)';
		return await conn.Query(sql, [row.clubid,row.userid,row.playtimes,row.uid,row.ctime]);
	},
	tb_monthplaytimes_update: async function (conn ,row) {
		let sql ='update "tb_monthplaytimes" set "clubid"=$1,"userid"=$2,"playtimes"=$3,"uid"=$4,"ctime"=$5';
		return await conn.Query(sql, [row.clubid,row.userid,row.playtimes,row.uid,row.ctime]);
	},
	tb_monthplaytimes_select: async function(conn ,row) {
		let sql ='select "clubid","userid","playtimes","uid","ctime" from "tb_monthplaytimes"';
		// row.clubid,row.userid,row.playtimes,row.uid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_monthplaytimes_delete: async function (conn ,row) {
		let sql ='delete from "tb_monthplaytimes"';
		// row.clubid,row.userid,row.playtimes,row.uid,row.ctime
		return await conn.Query(sql, []);
	},
	tb_monthplaytimes_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_monthplaytimes"';
		// row.clubid,row.userid,row.playtimes,row.uid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_monthplaytimes_list: async function(conn ,row) {
		let sql ='select "clubid","userid","playtimes","uid","ctime" from "tb_monthplaytimes" limit $1 offset $2';
		// row.clubid,row.userid,row.playtimes,row.uid,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}