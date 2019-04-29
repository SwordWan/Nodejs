module.exports = {
	tb_game_add: async function (conn ,row) {
		let sql ='insert into "tb_game" ("ym","dt","ctime","forsearch") values ($1,$2,$3,$4)';
		return await conn.Query(sql, [row.ym,row.dt,row.ctime,row.forsearch]);
	},
	tb_game_update: async function (conn ,row) {
		let sql ='update "tb_game" set "ym"=$1,"dt"=$2,"ctime"=$3,"forsearch"=$4';
		return await conn.Query(sql, [row.ym,row.dt,row.ctime,row.forsearch]);
	},
	tb_game_select: async function(conn ,row) {
		let sql ='select "ym","dt","ctime","forsearch" from "tb_game"';
		// row.ym,row.dt,row.ctime,row.forsearch
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_game_delete: async function (conn ,row) {
		let sql ='delete from "tb_game"';
		// row.ym,row.dt,row.ctime,row.forsearch
		return await conn.Query(sql, []);
	},
	tb_game_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_game"';
		// row.ym,row.dt,row.ctime,row.forsearch
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_game_list: async function(conn ,row) {
		let sql ='select "ym","dt","ctime","forsearch" from "tb_game" limit $1 offset $2';
		// row.ym,row.dt,row.ctime,row.forsearch
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}