module.exports = {
	tb_clubjjalertmessage_add: async function (conn ,row) {
		let sql ='insert into "tb_clubjjalertmessage" ("ctime","clubname","alertgolds","clubid") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.ctime,row.clubname,row.alertgolds,row.clubid]);
	},
	tb_clubjjalertmessage_update: async function (conn ,row) {
		let sql ='update "tb_clubjjalertmessage" set "ctime"=$1,"clubname"=$2,"alertgolds"=$3,"clubid"=$4';
		return await conn.Query(sql, [row.ctime,row.clubname,row.alertgolds,row.clubid]);
	},
	tb_clubjjalertmessage_select: async function(conn ,row) {
		let sql ='select "ctime","clubname","alertgolds","clubid" from "tb_clubjjalertmessage"';
		// row.ctime,row.clubname,row.alertgolds,row.clubid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_clubjjalertmessage_delete: async function (conn ,row) {
		let sql ='delete from "tb_clubjjalertmessage"';
		// row.ctime,row.clubname,row.alertgolds,row.clubid
		return await conn.Query(sql, []);
	},
	tb_clubjjalertmessage_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_clubjjalertmessage"';
		// row.ctime,row.clubname,row.alertgolds,row.clubid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_clubjjalertmessage_list: async function(conn ,row) {
		let sql ='select "ctime","clubname","alertgolds","clubid" from "tb_clubjjalertmessage" limit $1 offset $2';
		// row.ctime,row.clubname,row.alertgolds,row.clubid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}