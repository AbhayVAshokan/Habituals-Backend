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
                // Hashing the password
                bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                    if (err) {
                        return res.status(500).json({
                            status: false,
                            error: err,
                        })
                    } else {
                        realtime.User.create({
                            id: uuid.v4(),  // generating unique id
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
        for (var i = 0; i < 5; i++) {
            sum += jsonFile[`${i + 1}`]
        }
        return sum / 5
    }

    // Parsing body parameters
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
                })
                    .then((userQueries) => {
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

// API to create a new nudge
router.post('/nudge', checkAuth, (req, res, next) => {
    const type = req.body.type
    const title = req.body.title
    const userId = realtime.auth.userId
    const nudgeBooster = req.body.nudgeBooster
    const date = req.body.date ? req.body.date : Date()
    const standardType = ['body', 'mind', 'relationship', 'achievement', 'personalDevelopment']
        .find(element => element == type) != undefined

    if (!title) {
        res.status(404).json({
            status: false,
            error: 'title parameter is required',
        })
    } else if (!type) {
        res.status(404).json({
            status: false,
            error: 'type parameter is required',
        })
    } else if (!standardType) {
        res.status(500).json({
            status: false,
            error: 'Invalid title',
        })
    } else {
        console.log('valid title')
        realtime.Nudge.create({
            id: userId,
            type: type,
            status: 'not completed',
            date: date,
            nudgeBooster: nudgeBooster,
        })
            .then((result) => {
                res.status(201).json({
                    status: true,
                })
            })
            .catch((err) => {
                res.status(500).json({
                    status: false,
                    error: err.message,
                })
            })
    }
})

// API to fetch all the nudges
router.get('/nudge', checkAuth, (req, res, next) => {
    const userId = realtime.auth.userId

    realtime.Nudge.findAll({ id: userId })
        .then((nudges) => {
            if (nudges.length == 0) {
                res.status(404).json({
                    status: false,
                    error: `No nudges available`
                })
            } else {
                res.status(200).json({
                    status: true,
                    nudges: nudges.map((nudge) => {
                        return {
                            id: nudge.id,
                            type: nudge.type,
                            title: nudge.title,
                            status: nudge.status,
                            date: nudge.date
                        }
                    }),
                })
            }

        })
        .catch((err) => {
            res.status(500).json({
                status: false,
                error: err.message,
            })
        })
})

// API to fetch the nudges of a specific type
router.get('/nudge/:type', checkAuth, (req, res, next) => {
    const type = req.params.type
    const userId = realtime.auth.userId
    const standardType = ['body', 'mind', 'relationship', 'achievement', 'personalDevelopment']
        .find(element => element == type) != undefined

    realtime.Nudge.findAll({ where: { id: userId } })
        .then((nudges) => {
            if (standardType) {
                const typeNudges = nudges.find({ type: type })

                if (typeNudges.length == 0) {
                    res.status(404).json({
                        status: false,
                        error: `No nudges of type ${type} available`
                    })
                } else {

                    res.status(200).json({
                        status: true,
                        type: type,
                        nudges: typeNudges.map((nudge) => {
                            return {
                                id: nudge.id,
                                type: nudge.type,
                                title: nudge.title,
                                status: nudge.status,
                                date: nudge.date
                            }
                        }),
                    })
                }
            }
        })
        .catch((err) => {
            res.status(404).json({
                status: false,
                error: err.message,
            })
        })
})

module.exports = router