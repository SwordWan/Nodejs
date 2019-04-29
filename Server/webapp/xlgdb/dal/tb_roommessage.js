module.exports = {
	tb_roommessage_add: async function (conn ,row) {
		let sql ='insert into "tb_roommessage" ("roomid","userid","msgs","ctime") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.roomid,row.userid,row.msgs,row.ctime]);
	},
	tb_roommessage_update: async function (conn ,row) {
		let sql ='update "tb_roommessage" set "roomid"=$1,"userid"=$2,"msgs"=$3,"ctime"=$4';
		return await conn.Query(sql, [row.roomid,row.userid,row.msgs,row.ctime]);
	},
	tb_roommessage_select: async function(conn ,row) {
		let sql ='select "roomid","userid","msgs","ctime" from "tb_roommessage"';
		// row.roomid,row.userid,row.msgs,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_roommessage_delete: async function (conn ,row) {
		let sql ='delete from "tb_roommessage"';
		// row.roomid,row.userid,row.msgs,row.ctime
		return await conn.Query(sql, []);
	},
	tb_roommessage_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_roommessage"';
		// row.roomid,row.userid,row.msgs,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_roommessage_list: async function(conn ,row) {
		let sql ='select "roomid","userid","msgs","ctime" from "tb_roommessage" limit $1 offset $2';
		// row.roomid,row.userid,row.msgs,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}