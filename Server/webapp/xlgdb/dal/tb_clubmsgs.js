module.exports = {
	tb_clubmsgs_add: async function (conn ,row) {
		let sql ='insert into "tb_clubmsgs" ("uid","msgtype","desc","ctime","userid") values ($1,$2,$3,$4,$5)';
		return await conn.Query(sql, [row.uid,row.msgtype,row.desc,row.ctime,row.userid]);
	},
	tb_clubmsgs_update: async function (conn ,row) {
		let sql ='update "tb_clubmsgs" set "uid"=$1,"msgtype"=$2,"desc"=$3,"ctime"=$4,"userid"=$5';
		return await conn.Query(sql, [row.uid,row.msgtype,row.desc,row.ctime,row.userid]);
	},
	tb_clubmsgs_select: async function(conn ,row) {
		let sql ='select "uid","msgtype","desc","ctime","userid" from "tb_clubmsgs"';
		// row.uid,row.msgtype,row.desc,row.ctime,row.userid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_clubmsgs_delete: async function (conn ,row) {
		let sql ='delete from "tb_clubmsgs"';
		// row.uid,row.msgtype,row.desc,row.ctime,row.userid
		return await conn.Query(sql, []);
	},
	tb_clubmsgs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_clubmsgs"';
		// row.uid,row.msgtype,row.desc,row.ctime,row.userid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_clubmsgs_list: async function(conn ,row) {
		let sql ='select "uid","msgtype","desc","ctime","userid" from "tb_clubmsgs" limit $1 offset $2';
		// row.uid,row.msgtype,row.desc,row.ctime,row.userid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}