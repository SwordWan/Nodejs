module.exports = {
	tb_alliance_add: async function (conn ,row) {
		let sql ='insert into "tb_alliance" ("sname","creator","ctime","clubcount","allow_apply","memo","levels","allianceid","creatorclubid","mgrcount","uid") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)';
		return await conn.Query(sql, [row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid]);
	},
	tb_alliance_update: async function (conn ,row) {
		let sql ='update "tb_alliance" set "sname"=$1,"creator"=$2,"ctime"=$3,"clubcount"=$4,"allow_apply"=$5,"memo"=$6,"levels"=$7,"allianceid"=$8,"creatorclubid"=$9,"mgrcount"=$10,"uid"=$11';
		return await conn.Query(sql, [row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid]);
	},
	tb_alliance_select: async function(conn ,row) {
		let sql ='select "sname","creator","ctime","clubcount","allow_apply","memo","levels","allianceid","creatorclubid","mgrcount","uid" from "tb_alliance"';
		// row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_alliance_delete: async function (conn ,row) {
		let sql ='delete from "tb_alliance"';
		// row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid
		return await conn.Query(sql, []);
	},
	tb_alliance_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_alliance"';
		// row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_alliance_list: async function(conn ,row) {
		let sql ='select "sname","creator","ctime","clubcount","allow_apply","memo","levels","allianceid","creatorclubid","mgrcount","uid" from "tb_alliance" limit $1 offset $2';
		// row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	},
	tb_alliance_select_by_allianceid: async function(conn ,allianceid) {
		let sql ='select "sname","creator","ctime","clubcount","allow_apply","memo","levels","allianceid","creatorclubid","mgrcount","uid" from "tb_alliance" where "allianceid"=$1';
		// row.sname,row.creator,row.ctime,row.clubcount,row.allow_apply,row.memo,row.levels,row.allianceid,row.creatorclubid,row.mgrcount,row.uid
		return await conn.Query(sql, [allianceid]);
	},

}