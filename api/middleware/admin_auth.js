const jwt = require('jsonwebtoken')
const keys = require('../../resources/keys')
const realtime = require('../../resources/realtime_data')

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ').slice(-1)[0];
        const decode = jwt.verify(token, keys.tokenJWTKey)
        realtime.auth = decode
        next()
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: 'Invalid Token',
        })
    }
}