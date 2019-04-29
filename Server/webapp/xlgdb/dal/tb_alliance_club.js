module.exports = {
	tb_alliance_club_add: async function (conn ,row) {
		let sql ='insert into "tb_alliance_club" ("allianceid","status","clubid","ctime","uid","clubcreator","isadmin","alliancecreator") values ($1,$2,$3,$4,$5,$6,$7,$8)';
		return await conn.Query(sql, [row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator]);
	},
	tb_alliance_club_update: async function (conn ,row) {
		let sql ='update "tb_alliance_club" set "allianceid"=$1,"status"=$2,"clubid"=$3,"ctime"=$4,"uid"=$5,"clubcreator"=$6,"isadmin"=$7,"alliancecreator"=$8';
		return await conn.Query(sql, [row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator]);
	},
	tb_alliance_club_select: async function(conn ,row) {
		let sql ='select "allianceid","status","clubid","ctime","uid","clubcreator","isadmin","alliancecreator" from "tb_alliance_club"';
		// row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_alliance_club_delete: async function (conn ,row) {
		let sql ='delete from "tb_alliance_club"';
		// row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator
		return await conn.Query(sql, []);
	},
	tb_alliance_club_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_alliance_club"';
		// row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_alliance_club_list: async function(conn ,row) {
		let sql ='select "allianceid","status","clubid","ctime","uid","clubcreator","isadmin","alliancecreator" from "tb_alliance_club" limit $1 offset $2';
		// row.allianceid,row.status,row.clubid,row.ctime,row.uid,row.clubcreator,row.isadmin,row.alliancecreator
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}