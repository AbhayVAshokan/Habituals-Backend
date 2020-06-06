const uuid = require('uuid')
const express = require('express')
const keys = require('../../resources/keys')
const realtime = require('../../resources/realtime_data')
const controllers = require('../controllers/admin_controllers')

const router = express.Router()

router.get('/', (req, res, next) => {
    res.status(423).json({
        message: req.headers
    })
})

// Retreive all users
router.get('/user', (req, res, next) => {
    realtime.User.findAll()
        .then((users) => {
            res.status(200).json({
                status: true,
                users: users.map((user) => {
                    return {
                        id: user.id,
                        emailAddress: user.emailAddress,
                        mailingList: user.mailingList ? 'subscribed' : 'not subscribed',
                        age: user.age,
                        gender: user.gender,
                        position: user.position,
                        profile: {
                            type: 'GET',
                            profile: `${keys.baseUrl}:${keys.port}/admin/user/${user.id}`
                        }
                    }
                }),
            })
        })
        .catch((err) => {
            res.status(500).json({
                status: false,
                error: err.message,
            })
        })
})

// Retreive user of a given id
router.get('/user/:id', (req, res, next) => {
    realtime.User.findOne({ where: { id: req.params.id } })
        .then((user) => {
            console.log(user)
            if (user === null || user.length == 0) {
                res.status(404).json({
                    status: false,
                    error: 'User not found',
                })
            } else {
                res.status(200).json({
                    status: true,
                    user: {
                        id: user.id,
                        emailAddress: user.emailAddress,
                        age: user.age,
                        gender: user.gender,
                        position: user.position,
                        mailingList: user.mailingList,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    },
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

// Delete a user 
router.delete('/user/:id', (req, res, next) => {
    realtime.User.destroy({
        where: { id: req.params.id }
    })
        .then((result) => {
            if (result == 1) {
                res.status(200).json({
                    status: true,
                })
            } else {
                res.status(404).json({
                    status: false,
                    error: 'User not found'
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

// Retreive and display all the nudges
router.get('/nudge', (req, res, next) => {
    realtime.AdminNudge.findAll()
        .then((nudges) => {
            res.status(200).json({
                status: true,
                count: nudges.length,
                nudges: nudges.map((nudge) => {
                    return {
                        id: nudge.id,
                        type: nudge.type,
                        title: nudge.title,
                        nudgeBooster: nudge.nudgeBooster,
                        nudge: {
                            type: 'GET',
                            url: `${keys.baseUrl}:${keys.port}/admin/nudge/${nudge.id}`

                        }
                    }

                })
            })
        })
        .catch((err) => {
            res.status(500).json({
                status: false,
                error: err.message,
            })
        })
})

// Retreive nudge of a particular id
router.get('/nudge/:id', (req, res, next) => {
    realtime.AdminNudge.findOne({ where: { id: req.params.id } })
        .then((nudge) => {
            if (nudge.length == 0) {
                res.status(404).json({
                    status: false,
                    error: 'nudge not found'
                })
            } else {
                res.status(200).json({
                    status: true,
                    nudge,
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

// Add a new nudge
router.post('/nudge', (req, res, next) => {
    try {
        realtime.AdminNudge.create({
            id: uuid.v4(),
            type: req.body.type ? req.body.type : null,
            title: req.body.title ? req.body.title : null,
            nudgeBooster: req.body.nudgeBooster ? req.body.nudgeBooster : null,
        })
            .then((nudge) => {
                controllers.addNudges(nudge)

                res.status(201).json({
                    status: true,
                    nudge,
                })
            })
    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message,
        })
    }
})

// modify an existing nudge
router.patch('/nudge/:id', (req, res, next) => {
    const updateOps = {};
    for (const ops of Object.keys(req.body)) {
        updateOps[ops] = req.body[ops];
    }

    realtime.AdminNudge.update(updateOps, {
        where: {
            id: req.params.id
        }
    }).then(function () {
        res.status(200).json({
            status: true,
        })
    })
        .catch(err => {
            res.status(500).json({
                status: false,
                error: err.message,
            })
        })
})

// delete an existing nudge
router.delete('/nudge/:id', (req, res, next) => {
    realtime.AdminNudge.destroy(
        {
            where: { id: req.params.id }
        })
        .then((result) => {
            res.status(200).json({
                status: true,
            })
        })
        .catch((err) => {
            res.status(500).json({
                status: false,
                error: err.message
            })
        })
})

module.exports = router