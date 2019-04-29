module.exports = {
	tb_rooms_add: async function (conn ,row) {
		let sql ='insert into "tb_rooms" ("roomid","roomuuid","creator","clubid","gameid","roomargs","playtimes","players","ctime","ipaddr","port","valid","times","tmlen","gameinfo","allid","basefen") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)';
		return await conn.Query(sql, [row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen]);
	},
	tb_rooms_update: async function (conn ,row) {
		let sql ='update "tb_rooms" set "roomid"=$1,"roomuuid"=$2,"creator"=$3,"clubid"=$4,"gameid"=$5,"roomargs"=$6,"playtimes"=$7,"players"=$8,"ctime"=$9,"ipaddr"=$10,"port"=$11,"valid"=$12,"times"=$13,"tmlen"=$14,"gameinfo"=$15,"allid"=$16,"basefen"=$17';
		return await conn.Query(sql, [row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen]);
	},
	tb_rooms_select: async function(conn ,row) {
		let sql ='select "roomid","roomuuid","creator","clubid","gameid","roomargs","playtimes","players","ctime","ipaddr","port","valid","times","tmlen","gameinfo","allid","basefen" from "tb_rooms"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_rooms_delete: async function (conn ,row) {
		let sql ='delete from "tb_rooms"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen
		return await conn.Query(sql, []);
	},
	tb_rooms_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_rooms"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_rooms_list: async function(conn ,row) {
		let sql ='select "roomid","roomuuid","creator","clubid","gameid","roomargs","playtimes","players","ctime","ipaddr","port","valid","times","tmlen","gameinfo","allid","basefen" from "tb_rooms" limit $1 offset $2';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.playtimes,row.players,row.ctime,row.ipaddr,row.port,row.valid,row.times,row.tmlen,row.gameinfo,row.allid,row.basefen
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}