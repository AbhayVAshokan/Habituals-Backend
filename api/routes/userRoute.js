// APIs on /user route

const express = require('express')

const User = require('../models/user')

const router = express.Router()

// API to register a user
router.post('/register', (req, res, next) => {
    res.status(201).json(user);
})

module.exports = router