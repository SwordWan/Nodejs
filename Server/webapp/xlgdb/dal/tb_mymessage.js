module.exports = {
	tb_mymessage_add: async function (conn ,row) {
		let sql ='insert into "tb_mymessage" ("userid","msgs","title","uid","ctime") values ($1,$2,$3,$4,$5)';
		return await conn.Query(sql, [row.userid,row.msgs,row.title,row.uid,row.ctime]);
	},
	tb_mymessage_update: async function (conn ,row) {
		let sql ='update "tb_mymessage" set "userid"=$1,"msgs"=$2,"title"=$3,"uid"=$4,"ctime"=$5';
		return await conn.Query(sql, [row.userid,row.msgs,row.title,row.uid,row.ctime]);
	},
	tb_mymessage_select: async function(conn ,row) {
		let sql ='select "userid","msgs","title","uid","ctime" from "tb_mymessage"';
		// row.userid,row.msgs,row.title,row.uid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_mymessage_delete: async function (conn ,row) {
		let sql ='delete from "tb_mymessage"';
		// row.userid,row.msgs,row.title,row.uid,row.ctime
		return await conn.Query(sql, []);
	},
	tb_mymessage_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_mymessage"';
		// row.userid,row.msgs,row.title,row.uid,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_mymessage_list: async function(conn ,row) {
		let sql ='select "userid","msgs","title","uid","ctime" from "tb_mymessage" limit $1 offset $2';
		// row.userid,row.msgs,row.title,row.uid,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}