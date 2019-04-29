module.exports = {
	tb_clubs_add: async function (conn ,row) {
		let sql ='insert into "tb_clubs" ("clubid","creator","desc","ctime","levels","jifen","golds","activity","sname","adminusers","unions","icourl","olnums","unums","roomcount","allianceid","alliancename","endtime","msgcount","alliancemsgcount","forsearch","alertgolds","alerted","alertmsgcount") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)';
		return await conn.Query(sql, [row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount]);
	},
	tb_clubs_update: async function (conn ,row) {
		let sql ='update "tb_clubs" set "clubid"=$1,"creator"=$2,"desc"=$3,"ctime"=$4,"levels"=$5,"jifen"=$6,"golds"=$7,"activity"=$8,"sname"=$9,"adminusers"=$10,"unions"=$11,"icourl"=$12,"olnums"=$13,"unums"=$14,"roomcount"=$15,"allianceid"=$16,"alliancename"=$17,"endtime"=$18,"msgcount"=$19,"alliancemsgcount"=$20,"forsearch"=$21,"alertgolds"=$22,"alerted"=$23,"alertmsgcount"=$24';
		return await conn.Query(sql, [row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount]);
	},
	tb_clubs_select: async function(conn ,row) {
		let sql ='select "clubid","creator","desc","ctime","levels","jifen","golds","activity","sname","adminusers","unions","icourl","olnums","unums","roomcount","allianceid","alliancename","endtime","msgcount","alliancemsgcount","forsearch","alertgolds","alerted","alertmsgcount" from "tb_clubs"';
		// row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_clubs_delete: async function (conn ,row) {
		let sql ='delete from "tb_clubs"';
		// row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount
		return await conn.Query(sql, []);
	},
	tb_clubs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_clubs"';
		// row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_clubs_list: async function(conn ,row) {
		let sql ='select "clubid","creator","desc","ctime","levels","jifen","golds","activity","sname","adminusers","unions","icourl","olnums","unums","roomcount","allianceid","alliancename","endtime","msgcount","alliancemsgcount","forsearch","alertgolds","alerted","alertmsgcount" from "tb_clubs" limit $1 offset $2';
		// row.clubid,row.creator,row.desc,row.ctime,row.levels,row.jifen,row.golds,row.activity,row.sname,row.adminusers,row.unions,row.icourl,row.olnums,row.unums,row.roomcount,row.allianceid,row.alliancename,row.endtime,row.msgcount,row.alliancemsgcount,row.forsearch,row.alertgolds,row.alerted,row.alertmsgcount
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}