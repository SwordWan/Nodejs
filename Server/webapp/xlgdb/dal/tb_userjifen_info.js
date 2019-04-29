module.exports = {
	tb_userjifen_info_add: async function (conn ,row) {
		let sql ='insert into "tb_userjifen_info" ("uid","userid","roomuuid","jifendr","jifenkc","jifen","clubid","jifenyq","stakes") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
		return await conn.Query(sql, [row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes]);
	},
	tb_userjifen_info_update: async function (conn ,row) {
		let sql ='update "tb_userjifen_info" set "uid"=$1,"userid"=$2,"roomuuid"=$3,"jifendr"=$4,"jifenkc"=$5,"jifen"=$6,"clubid"=$7,"jifenyq"=$8,"stakes"=$9';
		return await conn.Query(sql, [row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes]);
	},
	tb_userjifen_info_select: async function(conn ,row) {
		let sql ='select "uid","userid","roomuuid","jifendr","jifenkc","jifen","clubid","jifenyq","stakes" from "tb_userjifen_info"';
		// row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_userjifen_info_delete: async function (conn ,row) {
		let sql ='delete from "tb_userjifen_info"';
		// row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes
		return await conn.Query(sql, []);
	},
	tb_userjifen_info_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_userjifen_info"';
		// row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_userjifen_info_list: async function(conn ,row) {
		let sql ='select "uid","userid","roomuuid","jifendr","jifenkc","jifen","clubid","jifenyq","stakes" from "tb_userjifen_info" limit $1 offset $2';
		// row.uid,row.userid,row.roomuuid,row.jifendr,row.jifenkc,row.jifen,row.clubid,row.jifenyq,row.stakes
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}