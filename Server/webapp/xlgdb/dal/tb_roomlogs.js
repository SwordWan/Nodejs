module.exports = {
	tb_roomlogs_add: async function (conn ,row) {
		let sql ='insert into "tb_roomlogs" ("roomid","roomuuid","creator","clubid","gameid","roomargs","ctime","tmlen","playtimes","allid") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
		return await conn.Query(sql, [row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid]);
	},
	tb_roomlogs_update: async function (conn ,row) {
		let sql ='update "tb_roomlogs" set "roomid"=$1,"roomuuid"=$2,"creator"=$3,"clubid"=$4,"gameid"=$5,"roomargs"=$6,"ctime"=$7,"tmlen"=$8,"playtimes"=$9,"allid"=$10';
		return await conn.Query(sql, [row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid]);
	},
	tb_roomlogs_select: async function(conn ,row) {
		let sql ='select "roomid","roomuuid","creator","clubid","gameid","roomargs","ctime","tmlen","playtimes","allid" from "tb_roomlogs"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_roomlogs_delete: async function (conn ,row) {
		let sql ='delete from "tb_roomlogs"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid
		return await conn.Query(sql, []);
	},
	tb_roomlogs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_roomlogs"';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_roomlogs_list: async function(conn ,row) {
		let sql ='select "roomid","roomuuid","creator","clubid","gameid","roomargs","ctime","tmlen","playtimes","allid" from "tb_roomlogs" limit $1 offset $2';
		// row.roomid,row.roomuuid,row.creator,row.clubid,row.gameid,row.roomargs,row.ctime,row.tmlen,row.playtimes,row.allid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}