const jwt = require('jsonwebtoken')
const keys = require('../../resources/keys')

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ').slice(-1)[0];
        jwt.verify(token, keys.tokenJWTKey)
        next()
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: 'Invalid Token',
        })
    }
}