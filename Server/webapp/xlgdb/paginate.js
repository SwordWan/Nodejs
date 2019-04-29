function Paginate(page, pagesize, total) {
    if (!page || page < 1) {
        page = 1;
    }
    if (!pagesize || pagesize < 1) {
        pagesize = 20;
    }
    if (!total || total < 0) {
        total = 0;
    }
    this.pagesize = pagesize;
    this.total = total;
    if (this.total % this.pagesize === 0) {
        this.maxpage = parseInt(this.total / this.pagesize);
    } else {
        this.maxpage = parseInt(this.total / this.pagesize) + 1;
    }
    if (page > this.maxpage) {
        this.page = this.maxpage;
    } else {
        this.page = page;
    }
}
/*
* 当前开始的条数
*/
Paginate.prototype.first = function () {
    var first = (this.page - 1) * this.pagesize;
    if (first > this.total) {
        return (this.maxpage - 1) * this.pagesize;
    }
    return first;
}
/*
* 当前页最大的条数
*/
Paginate.prototype.last = function () {
    var last = this.first() + this.pagesize;
    if (last > this.total) {
        return this.total;
    }
    return last;
}

/**
 * 上一页
 * @returns {number}
 */
Paginate.prototype.prev = function () {
    if (this.page <= 1) {
        return 1;
    }
    return this.page - 1;
}

/**
 * 下一页
 * @returns {*}
 */
Paginate.prototype.next = function () {
    if (this.page >= this.maxpage) {
        return this.maxpage;
    }
    return this.page + 1;
}
module.exports = Paginate;