// A huge nudge which handles all the nudges of all the users for each day

const Sequelize = require('sequelize')

const nudgeSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    userId: Sequelize.STRING,
    nudgeId: Sequelize.STRING,
    status: {
        type: Sequelize.STRING,
        required: true,
    },
    date: {
        type: Sequelize.DATE,
        default: Date.now
    },
}

module.exports = nudgeSchema