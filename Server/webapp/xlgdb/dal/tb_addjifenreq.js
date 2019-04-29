module.exports = {
	tb_addjifenreq_add: async function (conn ,row) {
		let sql ='insert into "tb_addjifenreq" ("userclub","userid","ctime","clubid","uid","infos","roomcreator","roomuuid","roomid") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
		return await conn.Query(sql, [row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid]);
	},
	tb_addjifenreq_update: async function (conn ,row) {
		let sql ='update "tb_addjifenreq" set "userclub"=$1,"userid"=$2,"ctime"=$3,"clubid"=$4,"uid"=$5,"infos"=$6,"roomcreator"=$7,"roomuuid"=$8,"roomid"=$9';
		return await conn.Query(sql, [row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid]);
	},
	tb_addjifenreq_select: async function(conn ,row) {
		let sql ='select "userclub","userid","ctime","clubid","uid","infos","roomcreator","roomuuid","roomid" from "tb_addjifenreq"';
		// row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_addjifenreq_delete: async function (conn ,row) {
		let sql ='delete from "tb_addjifenreq"';
		// row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid
		return await conn.Query(sql, []);
	},
	tb_addjifenreq_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_addjifenreq"';
		// row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_addjifenreq_list: async function(conn ,row) {
		let sql ='select "userclub","userid","ctime","clubid","uid","infos","roomcreator","roomuuid","roomid" from "tb_addjifenreq" limit $1 offset $2';
		// row.userclub,row.userid,row.ctime,row.clubid,row.uid,row.infos,row.roomcreator,row.roomuuid,row.roomid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}