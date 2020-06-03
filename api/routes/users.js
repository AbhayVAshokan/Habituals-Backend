const uuid = require('uuid')
const bcrypt = require('bcrypt')
const express = require('express')
const jwt = require('jsonwebtoken')
const keys = require('../../resources/keys')
const checkAuth = require('../middleware/check_auth')
const realtime = require('../../resources/realtime_data')

const router = express.Router()

// API to register user into the database
router.post('/register', (req, res, next) => {
    console.log('inside register')
    if (!req.body.emailAddress)
        res.status(500).json({
            status: false,
            error: 'Email address cannot be empty',
        })
    else if (!req.body.password)
        res.status(500).json({
            status: false,
            error: 'Password cannot be empty',
        })

    else {
        realtime.User.findAll({
            where: {
                emailAddress: req.body.emailAddress
            }
        }).then((user) => {
            if (user.length >= 1) {
                res.status(409).json({
                    status: false,
                    error: 'Email Address already exists'
                })
            } else {
                bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                    if (err) {
                        return res.status(500).json({
                            status: false,
                            error: err,
                        })
                    } else {
                        realtime.User.create({
                            id: uuid.v4(),
                            age: req.body.age,
                            gender: req.body.gender,
                            password: hashedPassword,
                            position: req.body.position,
                            mailingList: req.body.mailingList,
                            emailAddress: req.body.emailAddress,
                        })
                            .then((result) => {
                                res.status(201).json({
                                    status: true,
                                    id: result.id,
                                    profile: {
                                        type: 'GET',
                                        url: `${keys.baseUrl}:${keys.port}/user/getProfile`,
                                        authorization: 'bearer token',
                                    },
                                    message: 'Successfully registered'
                                })
                            })
                            .catch((err) => {
                                res.status(500).json({
                                    status: false,
                                    error: err,
                                })
                            })
                    }
                })
            }
        })
    }
})

// API to login the currrent user
router.post('/login', (req, res, next) => {
    if (!req.body.emailAddress)
        res.status(500).json({
            status: false,
            error: 'Email address cannot be empty',
        })
    else if (!req.body.password)
        res.status(500).json({
            status: false,
            error: 'Password cannot be empty',
        })
    else {
        realtime.User.findAll({
            where: {
                emailAddress: req.body.emailAddress,
            }
        }).then((user) => {
            if (user.length < 1) {
                res.status(404).json({
                    status: false,
                    error: 'Email Address already exists',
                })
            } else {
                bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                    if (err || !result) {
                        res.status(409).json({
                            status: false,
                            error: 'Wrong password',
                        })
                    }
                    if (result) {
                        const token = jwt.sign({
                            emailAddress: user[0].emailAddress,
                            userId: user[0].id,
                        }, keys.tokenJWTKey)

                        res.status(200).json({
                            status: true,
                            id: result.id,
                            authToken: 'bearer ' + token,
                            profile: {
                                type: 'GET',
                                url: `${keys.baseUrl}:${keys.port}/user/getProfile`,
                                authorization: 'bearer token',
                            },
                        })
                    }
                })
            }
        })
    }
})

// API to store the set of solution for the initial set of 25 questions
router.post('/questions', checkAuth, (req, res, next) => {
    res.status(201).json({
        status: true,
    })
})

// API to fetch the user profile
router.get('/profile', (req, res, next) => {
    res.status(200).json({
        status: true,
    })
})

// API to fetch the nudges
router.get('/nudge/:type', (req, res, next) => {
    if (type)
        console.log(`Fetching ${req.params.type} nudges`)
    else
        console.log('Fetching all nudges')

    res.status(201).json({
        status: true
    })
})

module.exports = router