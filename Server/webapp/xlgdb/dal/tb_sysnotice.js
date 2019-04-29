module.exports = {
	tb_sysnotice_add: async function (conn ,row) {
		let sql ='insert into "tb_sysnotice" ("uid","imgurl","ctime") values ($1,$2,$3)';
		return await conn.Query(sql, [row.uid,row.imgurl,row.ctime]);
	},
	tb_sysnotice_update: async function (conn ,row) {
		let sql ='update "tb_sysnotice" set "uid"=$1,"imgurl"=$2,"ctime"=$3';
		return await conn.Query(sql, [row.uid,row.imgurl,row.ctime]);
	},
	tb_sysnotice_select: async function(conn ,row) {
		let sql ='select "uid","imgurl","ctime" from "tb_sysnotice"';
		// row.uid,row.imgurl,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_sysnotice_delete: async function (conn ,row) {
		let sql ='delete from "tb_sysnotice"';
		// row.uid,row.imgurl,row.ctime
		return await conn.Query(sql, []);
	},
	tb_sysnotice_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_sysnotice"';
		// row.uid,row.imgurl,row.ctime
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_sysnotice_list: async function(conn ,row) {
		let sql ='select "uid","imgurl","ctime" from "tb_sysnotice" limit $1 offset $2';
		// row.uid,row.imgurl,row.ctime
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}