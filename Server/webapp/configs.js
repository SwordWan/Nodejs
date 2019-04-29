module.exports = {
    ip: '192.168.0.181',
    port: 9701,
    driver: {
        driver: 'pgsql',
        options: {
            host: '127.0.0.1',
            user: 'postgres',
            password: '963852741',//'686868',
            database: 'xlgdb',
            port: 5432
        }
    },
    sms: {
        appID: "tianhuangjuxing",
        appKey: "tianhuangjuxing",
        register: {
            expire: 180,//过期时间
            reset_expire: 60,//重置时间
            message: '尊敬的客户您好，感谢注册成为我们的会员，您的注册码是:[code]'
        },
        forget: {
            expire: 180,//过期时间
            reset_expire: 60,//重置时间
            message: '您的验证码为:[code](晨融数字社区-密码重置),请勿泄露予他人。'
        }
    },
    redisSession: {
        host: "127.0.0.1",
        port: "8888",
        ttl: 1 * 24 * 60 * 60,   //Session的有效期
        prefix: "ccchen:",
        db: 0
    },
    redisSMS: {
        host: "127.0.0.1",
        port: "8888",
        db: 1
    },
    jiangchi: {
        host: "127.0.0.1",
        port: 2117
    }
}