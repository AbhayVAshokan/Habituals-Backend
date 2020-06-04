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
                console.log('hello world')
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
                                        url: `${keys.baseUrl}:${keys.port}/user/profile`,
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

                        res.status(201).json({
                            status: true,
                            id: result.id,
                            authToken: 'bearer ' + token,
                            profile: {
                                type: 'GET',
                                url: `${keys.baseUrl}:${keys.port}/user/profile`,
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
    const userId = realtime.auth.userId
    const defaultResponse = {
        1: 2.5,
        2: 2.5,
        3: 2.5,
        4: 2.5,
        5: 2.5,
    }

    function auditScore(jsonFile) {
        var sum = 0
        console.log(jsonFile)
        for (var i = 0; i < 5; i++) {
            sum += jsonFile[`${i + 1}`]
        }
        return sum / 5
    }

    const startDate = req.body.startDate ? req.body.startDate : Date()
    const general = req.body.generalQuery ? req.body.generalQuery : 2.5
    const body = req.body.bodyQuery ? req.body.bodyQuery : defaultResponse
    const mind = req.body.mindQuery ? req.body.mindQuery : defaultResponse
    const achievement = req.body.achievementQuery ? req.body.achievementQuery : defaultResponse
    const realtionship = req.body.relationshipQuery ? req.body.relationshipQuery : defaultResponse
    const personalDevelopment = req.body.personalDevelopmentQuery ? req.body.personalDevelopmentQuery : defaultResponse

    realtime.Query.create({
        userId: userId,
        startDate: startDate,
        generalQuery: general,
        bodyQuery: auditScore(body),
        mindQuery: auditScore(mind),
        achievementQuery: auditScore(achievement),
        relationshipQuery: auditScore(realtionship),
        personalDevelopmentQuery: auditScore(personalDevelopment),
    })
        .then((result) => {
            res.status(201).json({
                status: true,
            })
        })
        .catch((err) => {
            res.status(500).json({
                status: false,
                error: 'Queries are already collected before',
            })
        })
})

// API to fetch the user profile
router.get('/profile', checkAuth, (req, res, next) => {
    const userId = realtime.auth.userId
    const profile = {}

    try {
        realtime.User.findOne({
            id: userId
        })
            .then((user) => {
                realtime.Query.findOne({
                    id: userId
                }).then((userQueries) => {
                    res.status(200).json({
                        status: true,
                        id: user.id,
                        emailAddress: user.emailAddress,
                        mailingList: user.mailingList ? 'subscribed' : 'not subscribed',
                        age: user.age,
                        gender: user.gender,
                        position: user.position,
                        startDate: userQueries.startDate,
                        generalQuery: userQueries.generalQuery,
                        bodyQuery: userQueries.bodyQuery,
                        mindQuery: userQueries.mindQuery,
                        achievementQuery: userQueries.achievementQuery,
                        relationshipQuery: userQueries.relationshipQuery,
                        personalDevelopmentQuery: userQueries.personalDevelopmentQuery,
                    })
                })
            })
    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message,
        })
    }
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