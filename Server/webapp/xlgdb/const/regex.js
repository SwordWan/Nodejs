module.exports = {
    isID: function (id) {
        return /(^[1-9]\d*$)/.test(id)
    },
    isNumber: function (id) {
        return /(^[0-9]\d*$)/.test(id)
    }
}