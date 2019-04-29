module.exports = {
	tb_usermessage_add: async function (conn ,row) {
		let sql ='insert into "tb_usermessage" ("userid","message","ctime") values ($1,$2,$3)';
		return await conn.Query(sql, [row.userid,row.message,row.ctime]);
	},
	tb_usermessage_update: async function (conn ,row) {
		let sql ='update "tb_usermessage" set "userid"=$1,"message"=$2,"ctime"=$3';
		return await conn.Query(sql, [row.userid,row.message,row.ctime]);
	},
	tb_usermessage_select: async function(conn ,row) {
		let sql ='select "userid","message","ctime" from "tb_usermessage"';
		// row.userid,row.message,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_usermessage_delete: async function (conn ,row) {
		let sql ='delete from "tb_usermessage"';
		// row.userid,row.message,row.ctime
		return await conn.Query(sql, []);
	},
	tb_usermessage_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_usermessage"';
		// row.userid,row.message,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_usermessage_list: async function(conn ,row) {
		let sql ='select "userid","message","ctime" from "tb_usermessage" limit $1 offset $2';
		// row.userid,row.message,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}