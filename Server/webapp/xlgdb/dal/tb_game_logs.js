module.exports = {
	tb_game_logs_add: async function (conn ,row) {
		let sql ='insert into "tb_game_logs" ("roomuuid","forsearch","ctime","ymd","clubid","shichang","dipi","zongshoushu","zongdairu","details","clubname","roomname") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)';
		return await conn.Query(sql, [row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname]);
	},
	tb_game_logs_update: async function (conn ,row) {
		let sql ='update "tb_game_logs" set "roomuuid"=$1,"forsearch"=$2,"ctime"=$3,"ymd"=$4,"clubid"=$5,"shichang"=$6,"dipi"=$7,"zongshoushu"=$8,"zongdairu"=$9,"details"=$10,"clubname"=$11,"roomname"=$12';
		return await conn.Query(sql, [row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname]);
	},
	tb_game_logs_select: async function(conn ,row) {
		let sql ='select "roomuuid","forsearch","ctime","ymd","clubid","shichang","dipi","zongshoushu","zongdairu","details","clubname","roomname" from "tb_game_logs"';
		// row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_game_logs_delete: async function (conn ,row) {
		let sql ='delete from "tb_game_logs"';
		// row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname
		return await conn.Query(sql, []);
	},
	tb_game_logs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_game_logs"';
		// row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_game_logs_list: async function(conn ,row) {
		let sql ='select "roomuuid","forsearch","ctime","ymd","clubid","shichang","dipi","zongshoushu","zongdairu","details","clubname","roomname" from "tb_game_logs" limit $1 offset $2';
		// row.roomuuid,row.forsearch,row.ctime,row.ymd,row.clubid,row.shichang,row.dipi,row.zongshoushu,row.zongdairu,row.details,row.clubname,row.roomname
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}