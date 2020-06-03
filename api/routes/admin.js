const express = require('express')
const app = require('../../app')

const router = express.Router()

router.get('/', (req, res, next) => {
    res.json({})
})

module.exports = router