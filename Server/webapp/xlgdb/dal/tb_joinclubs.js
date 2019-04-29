module.exports = {
	tb_joinclubs_add: async function (conn ,row) {
		let sql ='insert into "tb_joinclubs" ("userid","clubid","ctime","jifen","golds","clublevel","alliancelevel","status","uid","playtimes","jiesuan","forsearch","extdata","memo") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)';
		return await conn.Query(sql, [row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo]);
	},
	tb_joinclubs_update: async function (conn ,row) {
		let sql ='update "tb_joinclubs" set "userid"=$1,"clubid"=$2,"ctime"=$3,"jifen"=$4,"golds"=$5,"clublevel"=$6,"alliancelevel"=$7,"status"=$8,"uid"=$9,"playtimes"=$10,"jiesuan"=$11,"forsearch"=$12,"extdata"=$13,"memo"=$14';
		return await conn.Query(sql, [row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo]);
	},
	tb_joinclubs_select: async function(conn ,row) {
		let sql ='select "userid","clubid","ctime","jifen","golds","clublevel","alliancelevel","status","uid","playtimes","jiesuan","forsearch","extdata","memo" from "tb_joinclubs"';
		// row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo
		let res = await conn.Query(sql, []);
		return res.rows;
	},
	tb_joinclubs_delete: async function (conn ,row) {
		let sql ='delete from "tb_joinclubs"';
		// row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo
		return await conn.Query(sql, []);
	},
	tb_joinclubs_count: async function (conn ,row) {
		let sql ='select count(*) as total from "tb_joinclubs"';
		// row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo
		let res = await conn.Query(sql, []);
		return res.rows[0].total;
	},
	tb_joinclubs_list: async function(conn ,row) {
		let sql ='select "userid","clubid","ctime","jifen","golds","clublevel","alliancelevel","status","uid","playtimes","jiesuan","forsearch","extdata","memo" from "tb_joinclubs" limit $1 offset $2';
		// row.userid,row.clubid,row.ctime,row.jifen,row.golds,row.clublevel,row.alliancelevel,row.status,row.uid,row.playtimes,row.jiesuan,row.forsearch,row.extdata,row.memo
		let res = await conn.Query(sql, [row.size ,(row.page - 1) * row.size]);
		return res.rows;
	}

}