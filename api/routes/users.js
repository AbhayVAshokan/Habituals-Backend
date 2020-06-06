const uuid = require('uuid')
const bcrypt = require('bcrypt')
const express = require('express')
const jwt = require('jsonwebtoken')
const keys = require('../../resources/keys')
const checkAuth = require('../middleware/check_auth')
const realtime = require('../../resources/realtime_data')
const controllers = require('../controllers/user_controllers')

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
        try {
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
                                startDate: req.body.startDate ? req.body.startDate : Date()
                            })
                                .then((result) => {
                                    controllers.getNudges(result)

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
                        }
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message,
            })
        }
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
                    error: 'Email Address does not exist',
                    register: {
                        type: 'POST',
                        url: `${keys.baseUrl}:${keys.port}/user/register`,
                        body: {
                            emailAddress: 'string',
                            password: 'string',
                            gender: 'string',
                            age: 'number',
                            position: 'string'
                        }
                    }
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
    const type = "custom"
    const title = req.body.title
    const userId = realtime.auth.userId
    const nudgeBooster = req.body.nudgeBooster
    const date = req.body.date ? req.body.date : Date()

    if (!title) {
        res.status(404).json({
            status: false,
            error: 'title parameter is required',
        })
    } else {
        realtime.Nudge.create({
            id: uuid.v4(),
            userId: userId,
            nudgeId: uuid.v4(),
            status: 'not completed',
            date: date,
            nudgeBooster: nudgeBooster,
        })
            .then((result) => {
                realtime.CustomNudge.create({
                    id: result.dataValues.nudgeId,
                    type: type,
                    title: title,
                    nudgeBooster: nudgeBooster,
                })
                    .then((u) => { })

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
    // userId as decoded from the auth token
    const userId = realtime.auth.userId
    // list of all nudges of the current user
    var nudges = {
        status: true,
        count: null,
        nudges: [],
    }
    // list of all nudges retrieved from the userNudges table
    var userNudges = []

    // list of all nudges retrieved from adminNudges table
    var adminNudges = []

    // list of all nudges retrieved from customNudges table
    var customNudges = []

    try {
        // Retrieving all standard nudges
        realtime.AdminNudge.findAll()
            .then((_nudges) => {
                _nudges.forEach((_nudge) => {
                    adminNudges.push(_nudge.dataValues)
                })
            })

        // retrieving all the custom nudges
        realtime.CustomNudge.findAll()
            .then((_nudges) => {
                _nudges.forEach((_nudge) => {
                    customNudges.push(_nudge.dataValues)
                })
            })

        // retrieving all user nudges
        realtime.Nudge.findAll({
            where: {
                userId: userId,
            }
        })
            .then((_userNudges) => {
                _userNudges.forEach((_nudge) => {
                    userNudges.push(_nudge.dataValues)
                })
            })
            .then((_) => {
                var nudgeType = null
                var nudgeTitle = null
                var nudgeBooster = null

                userNudges.forEach((_nudge) => {
                    var matchFound = false

                    customNudges.forEach((_customNudge) => {
                        if (_customNudge.id == _nudge.nudgeId) {
                            matchFound = true
                            nudgeType = 'custom'
                            nudgeTitle = _customNudge.title
                            nudgeBooster = _customNudge.nudgeBooster
                        }
                    })
                    adminNudges.forEach((_adminNudge) => {
                        if (_adminNudge.id == _nudge.nudgeId) {
                            matchFound = true
                            nudgeType = _adminNudge.type
                            nudgeTitle = _adminNudge.title
                            nudgeBooster = _adminNudge.nudgeBooster
                        }
                    })

                    if (matchFound)
                        nudges.nudges.push({
                            id: _nudge.nudgeId,
                            type: nudgeType,
                            title: nudgeTitle,
                            nudgeBooster: nudgeBooster,
                            date: _nudge.date,
                            status: _nudge.status,
                        })
                })
                nudges.count = nudges.nudges.length
                if (nudges.count == 0) {
                    res.status(404).json({
                        status: false,
                        error: 'No nudges found'
                    })
                } else {
                    res.status(201).json(nudges)
                }
            })

    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message,
        })
    }
})

// API to fetch the nudges of a specific type
router.get('/nudge/:type', checkAuth, (req, res, next) => {
    // userId as decoded from the auth token
    const userId = realtime.auth.userId
    // [body, mind, relationship, achievement, personalDevelopment, custom]
    const type = req.params.type
    // list of all nudges of the current user
    var nudges = {
        status: true,
        count: null,
        nudges: [],
    }
    // list of all nudges retrieved from the userNudges table
    var userNudges = []

    // list of all nudges retrieved from adminNudges table
    var adminNudges = []

    // list of all nudges retrieved from customNudges table
    var customNudges = []

    try {
        // Retrieving all standard nudges
        realtime.AdminNudge.findAll({
            where: {
                type: type,
            }
        })
            .then((_nudges) => {
                _nudges.forEach((_nudge) => {
                    adminNudges.push(_nudge.dataValues)
                })
            })

        // retrieving all the custom nudges
        realtime.CustomNudge.findAll({
            where: {
                type: type
            }
        })
            .then((_nudges) => {
                _nudges.forEach((_nudge) => {
                    customNudges.push(_nudge.dataValues)
                })
            })

        // retrieving all user nudges
        realtime.Nudge.findAll({
            where: {
                userId: userId,
            }
        })
            .then((_userNudges) => {
                _userNudges.forEach((_nudge) => {
                    userNudges.push(_nudge.dataValues)
                })
            })
            .then((_) => {
                var nudgeType = null
                var nudgeTitle = null
                var nudgeBooster = null

                userNudges.forEach((_nudge) => {
                    var matchFound = false

                    if (type == 'custom') {
                        customNudges.forEach((_customNudge) => {
                            if (_customNudge.id == _nudge.nudgeId) {
                                matchFound = true
                                nudgeType = 'custom'
                                nudgeTitle = _customNudge.title
                                nudgeBooster = _customNudge.nudgeBooster
                            }
                        })
                    } else {
                        adminNudges.forEach((_adminNudge) => {
                            if (_adminNudge.id == _nudge.nudgeId) {
                                matchFound = true
                                nudgeType = _adminNudge.type
                                nudgeTitle = _adminNudge.title
                                nudgeBooster = _adminNudge.nudgeBooster
                            }
                        })
                    }

                    if (matchFound)
                        nudges.nudges.push({
                            id: _nudge.nudgeId,
                            type: nudgeType,
                            title: nudgeTitle,
                            nudgeBooster: nudgeBooster,
                            date: _nudge.date,
                            status: _nudge.status,
                        })
                })
                nudges.count = nudges.nudges.length
                if (nudges.count == 0) {
                    res.status(404).json({
                        status: false,
                        error: 'No nudges found'
                    })
                } else {
                    res.status(201).json(nudges)
                }
            })

    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message,
        })
    }
})

module.exports = router