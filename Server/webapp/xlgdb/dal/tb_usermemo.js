module.exports = {
	tb_usermemo_add: async function (conn ,row) {
		let sql ='insert into "tb_usermemo" ("clubid","userid","desc") values ($1,$2,$3)';
		return await conn.Query(sql, [row.clubid,row.userid,row.desc]);
	},
	tb_usermemo_update: async function (conn ,row) {
		let sql ='update "tb_usermemo" set "clubid"=$1,"userid"=$2,"desc"=$3';
		return await conn.Query(sql, [row.clubid,row.userid,row.desc]);
	},
	tb_usermemo_select: async function(conn ,row) {
		let sql ='select "clubid","userid","desc" from "tb_usermemo"';
		// row.clubid,row.userid,row.desc
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_usermemo_delete: async function (conn ,row) {
		let sql ='delete from "tb_usermemo"';
		// row.clubid,row.userid,row.desc
		return await conn.Query(sql, []);
	},
	tb_usermemo_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_usermemo"';
		// row.clubid,row.userid,row.desc
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_usermemo_list: async function(conn ,row) {
		let sql ='select "clubid","userid","desc" from "tb_usermemo" limit $1 offset $2';
		// row.clubid,row.userid,row.desc
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}