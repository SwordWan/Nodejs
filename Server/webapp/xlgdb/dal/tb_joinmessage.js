module.exports = {
	tb_joinmessage_add: async function (conn ,row) {
		let sql ='insert into "tb_joinmessage" ("fromname","toname","desc","type","userid","uid","clubid_allianceid") values ($1,$2,$3,$4,$5,$6,$7)';
		return await conn.Query(sql, [row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid]);
	},
	tb_joinmessage_update: async function (conn ,row) {
		let sql ='update "tb_joinmessage" set "fromname"=$1,"toname"=$2,"desc"=$3,"type"=$4,"userid"=$5,"uid"=$6,"clubid_allianceid"=$7';
		return await conn.Query(sql, [row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid]);
	},
	tb_joinmessage_select: async function(conn ,row) {
		let sql ='select "fromname","toname","desc","type","userid","uid","clubid_allianceid" from "tb_joinmessage"';
		// row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_joinmessage_delete: async function (conn ,row) {
		let sql ='delete from "tb_joinmessage"';
		// row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid
		return await conn.Query(sql, []);
	},
	tb_joinmessage_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_joinmessage"';
		// row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_joinmessage_list: async function(conn ,row) {
		let sql ='select "fromname","toname","desc","type","userid","uid","clubid_allianceid" from "tb_joinmessage" limit $1 offset $2';
		// row.fromname,row.toname,row.desc,row.type,row.userid,row.uid,row.clubid_allianceid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}